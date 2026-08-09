import json
import base64
from typing import Optional, Dict, Any
import httpx
from app.x402.schemas import PaymentResult, PaymentChallenge, PaymentStatus
from app.x402.wallet import get_agent_wallet
from app.core.config import get_settings
from x402.http.clients.httpx import wrapHttpxWithPayment

class X402Client:
    def __init__(self, db_session=None, investigation_id: Optional[str] = None, agent_run_id: Optional[str] = None):
        self.settings = get_settings()
        self.wallet = get_agent_wallet()
        self.db = db_session
        self.investigation_id = investigation_id
        self.agent_run_id = agent_run_id

    async def paid_get(
        self, 
        url: str, 
        params: Optional[Dict[str, Any]] = None, 
        headers: Optional[Dict[str, str]] = None
    ) -> PaymentResult:
        req_headers = headers or {}

        try:
            # 1. Get configured x402Client registered with EVM wallet account
            x402_sdk_client = self.wallet.get_configured_x402_client()
        except Exception as wallet_err:
            return PaymentResult(
                success=False,
                status=PaymentStatus.PAYMENT_FAILED,
                http_status_code=402,
                amount_usdc=0.15,
                error_code="WALLET_KEY_MISSING",
                error_details=f"x402 payment signing failed: {str(wallet_err)}"
            )

        # 2. Use official x402 SDK wrapHttpxWithPayment for 402 challenge/sign/retry flow
        try:
            async with wrapHttpxWithPayment(x402_sdk_client, timeout=45.0, headers=req_headers) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    tx_hash = None
                    payment_resp_header = response.headers.get("payment-response") or response.headers.get("X-PAYMENT-RESPONSE")
                    
                    if payment_resp_header:
                        try:
                            decoded = json.loads(base64.b64decode(payment_resp_header).decode("utf-8"))
                            tx_hash = decoded.get("transaction") or decoded.get("txHash")
                        except Exception:
                            pass

                    response_data = response.json() if "application/json" in response.headers.get("content-type", "") else {"text": response.text}

                    return PaymentResult(
                        success=True,
                        status=PaymentStatus.SUCCESS if tx_hash else PaymentStatus.NOT_REQUIRED,
                        http_status_code=200,
                        data=response_data,
                        tx_hash=tx_hash,
                        amount_usdc=0.001
                    )
                else:
                    return PaymentResult(
                        success=False,
                        status=PaymentStatus.PAYMENT_FAILED,
                        http_status_code=response.status_code,
                        amount_usdc=0.001,
                        error_code=f"HTTP_{response.status_code}",
                        error_details=response.text
                    )

        except Exception as e:
            return PaymentResult(
                success=False,
                status=PaymentStatus.PAYMENT_FAILED,
                http_status_code=500,
                amount_usdc=0.001,
                error_code="X402_CLIENT_ERROR",
                error_details=str(e)
            )

    async def paid_post(
        self, 
        url: str, 
        json_data: Optional[Dict[str, Any]] = None, 
        headers: Optional[Dict[str, str]] = None
    ) -> PaymentResult:
        req_headers = headers or {}
        try:
            x402_sdk_client = self.wallet.get_configured_x402_client()
        except Exception as wallet_err:
            return PaymentResult(
                success=False,
                status=PaymentStatus.PAYMENT_FAILED,
                http_status_code=402,
                amount_usdc=0.15,
                error_code="WALLET_KEY_MISSING",
                error_details=str(wallet_err)
            )

        try:
            async with wrapHttpxWithPayment(x402_sdk_client, timeout=45.0, headers=req_headers) as client:
                response = await client.post(url, json=json_data)
                
                if response.status_code == 200:
                    tx_hash = None
                    payment_resp_header = response.headers.get("payment-response") or response.headers.get("X-PAYMENT-RESPONSE")
                    if payment_resp_header:
                        try:
                            decoded = json.loads(base64.b64decode(payment_resp_header).decode("utf-8"))
                            tx_hash = decoded.get("transaction") or decoded.get("txHash")
                        except Exception:
                            pass

                    return PaymentResult(
                        success=True,
                        status=PaymentStatus.SUCCESS if tx_hash else PaymentStatus.NOT_REQUIRED,
                        http_status_code=200,
                        data=response.json() if "application/json" in response.headers.get("content-type", "") else {"text": response.text},
                        tx_hash=tx_hash,
                        amount_usdc=0.001
                    )
                else:
                    return PaymentResult(
                        success=False,
                        status=PaymentStatus.PAYMENT_FAILED,
                        http_status_code=response.status_code,
                        amount_usdc=0.001,
                        error_code=f"HTTP_{response.status_code}",
                        error_details=response.text
                    )
        except Exception as e:
            return PaymentResult(
                success=False,
                status=PaymentStatus.PAYMENT_FAILED,
                http_status_code=500,
                amount_usdc=0.001,
                error_code="X402_CLIENT_ERROR",
                error_details=str(e)
            )
