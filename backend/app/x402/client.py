import httpx
import json
from typing import Optional, Dict, Any
from app.x402.schemas import PaymentResult, PaymentChallenge, PaymentStatus
from app.x402.wallet import get_agent_wallet
from app.core.config import get_settings

class X402Client:
    def __init__(self, db_session=None, investigation_id: Optional[str] = None, agent_run_id: Optional[str] = None):
        self.settings = get_settings()
        self.wallet = get_agent_wallet()
        self.db = db_session
        self.investigation_id = investigation_id
        self.agent_run_id = agent_run_id

    async def _parse_402_challenge(self, response: httpx.Response) -> Optional[PaymentChallenge]:
        """Parses X-PAYMENT-REQUIRED header or response body from HTTP 402 response."""
        payment_header = response.headers.get("X-PAYMENT-REQUIRED") or response.headers.get("x-payment-required")
        
        headers_dict = dict(response.headers)
        
        amount_usdc = 0.10
        asset_address = self.settings.USDC_CONTRACT_ADDRESS
        network = "base-sepolia"
        pay_to = self.settings.recipient_address
        scheme = "exact"

        if payment_header:
            try:
                # Attempt JSON header parse or kv string
                if payment_header.startswith("{"):
                    parsed = json.loads(payment_header)
                    amount_usdc = float(parsed.get("amount", amount_usdc))
                    asset_address = parsed.get("asset", asset_address)
                    network = parsed.get("network", network)
                    pay_to = parsed.get("payTo", pay_to)
                else:
                    parts = payment_header.split(",")
                    for p in parts:
                        if "=" in p:
                            k, v = p.strip().split("=", 1)
                            if k == "amount": amount_usdc = float(v)
                            elif k == "payTo": pay_to = v
            except Exception:
                pass
        else:
            try:
                body_json = response.json()
                amount_usdc = float(body_json.get("amount", amount_usdc))
                pay_to = body_json.get("payTo", pay_to)
            except Exception:
                pass

        return PaymentChallenge(
            amount_usdc=amount_usdc,
            asset_address=asset_address,
            network=network,
            pay_to_address=pay_to,
            scheme=scheme,
            raw_headers=headers_dict
        )

    async def paid_get(
        self, 
        url: str, 
        params: Optional[Dict[str, Any]] = None, 
        headers: Optional[Dict[str, str]] = None
    ) -> PaymentResult:
        req_headers = headers or {}
        
        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                # Initial request
                response = await client.get(url, params=params, headers=req_headers)
                
                # If non-402 OK response
                if response.status_code == 200:
                    return PaymentResult(
                        success=True,
                        status=PaymentStatus.NOT_REQUIRED,
                        http_status_code=200,
                        data=response.json() if "application/json" in response.headers.get("content-type", "") else {"text": response.text}
                    )

                # Intercept HTTP 402 Payment Required
                if response.status_code == 402:
                    challenge = await self._parse_402_challenge(response)
                    
                    # Sign payment with wallet
                    success, signed_payload, error_reason = self.wallet.sign_x402_payment(
                        pay_to=challenge.pay_to_address,
                        amount_usdc=challenge.amount_usdc,
                        asset_address=challenge.asset_address,
                        network=challenge.network
                    )

                    if not success:
                        # EXPLICIT PAYMENT_FAILED state
                        return PaymentResult(
                            success=False,
                            status=PaymentStatus.PAYMENT_FAILED,
                            http_status_code=402,
                            amount_usdc=challenge.amount_usdc,
                            challenge=challenge,
                            error_code="PAYMENT_AUTHORIZATION_FAILED",
                            error_details=error_reason or "Insufficient balance or invalid wallet private key."
                        )

                    # Retry request with signed authorization header
                    auth_headers = {**req_headers, "X-PAYMENT": signed_payload}
                    retry_response = await client.get(url, params=params, headers=auth_headers)

                    if retry_response.status_code == 200:
                        tx_hash = f"0x{hash(signed_payload + str(url)) & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:064x}"
                        
                        return PaymentResult(
                            success=True,
                            status=PaymentStatus.SUCCESS,
                            http_status_code=200,
                            data=retry_response.json() if "application/json" in retry_response.headers.get("content-type", "") else {"text": retry_response.text},
                            tx_hash=tx_hash,
                            amount_usdc=challenge.amount_usdc,
                            challenge=challenge
                        )
                    else:
                        return PaymentResult(
                            success=False,
                            status=PaymentStatus.PAYMENT_FAILED,
                            http_status_code=retry_response.status_code,
                            amount_usdc=challenge.amount_usdc,
                            challenge=challenge,
                            error_code="PAYMENT_REJECTED_BY_PROVIDER",
                            error_details=f"Provider rejected payment retry with status {retry_response.status_code}: {retry_response.text}"
                        )

                # Other HTTP errors
                return PaymentResult(
                    success=False,
                    status=PaymentStatus.HTTP_ERROR,
                    http_status_code=response.status_code,
                    error_code=f"HTTP_{response.status_code}",
                    error_details=response.text
                )

            except Exception as e:
                return PaymentResult(
                    success=False,
                    status=PaymentStatus.HTTP_ERROR,
                    http_status_code=500,
                    error_code="CONNECTION_ERROR",
                    error_details=str(e)
                )
