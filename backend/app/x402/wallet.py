import os
import time
from typing import Optional, Dict, Any, Tuple
from eth_account import Account
from eth_account.messages import encode_typed_data
from app.core.config import get_settings

class AgentWallet:
    def __init__(self):
        self.settings = get_settings()
        self.private_key = self.settings.WALLET_PRIVATE_KEY
        self.account = Account.from_key(self.private_key) if self.private_key else None

    @property
    def address(self) -> Optional[str]:
        return self.account.address if self.account else None

    def has_wallet(self) -> bool:
        return self.account is not None

    def sign_x402_payment(
        self, 
        pay_to: str, 
        amount_usdc: float, 
        asset_address: str, 
        network: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Signs an EIP-712 typed payment authorization for x402 protocol.
        Returns: (success, signed_payload_or_tx_hash, error_reason)
        """
        if not self.has_wallet():
            return False, None, "WALLET_KEY_MISSING: WALLET_PRIVATE_KEY is not configured in environment."

        try:
            # EIP-712 Typed Data Structure for USDC Transfer Authorization
            domain_data = {
                "name": "USD Coin",
                "version": "2",
                "chainId": self.settings.CHAIN_ID,
                "verifyingContract": asset_address or self.settings.USDC_CONTRACT_ADDRESS,
            }

            types = {
                "TransferWithAuthorization": [
                    {"name": "from", "type": "address"},
                    {"name": "to", "type": "address"},
                    {"name": "value", "type": "uint256"},
                    {"name": "validAfter", "type": "uint256"},
                    {"name": "validBefore", "type": "uint256"},
                    {"name": "nonce", "type": "bytes32"},
                ]
            }

            value_units = int(amount_usdc * 1_000_000) # 6 decimals for USDC
            nonce = "0x" + os.urandom(32).hex()

            message_data = {
                "from": self.address,
                "to": pay_to,
                "value": value_units,
                "validAfter": 0,
                "validBefore": int(time.time()) + 3600,
                "nonce": nonce,
            }

            structured_data = {
                "types": types,
                "domain": domain_data,
                "primaryType": "TransferWithAuthorization",
                "message": message_data,
            }

            signed_message = Account.sign_typed_data(
                self.private_key,
                domain_data,
                types,
                message_data
            )

            # Generate synthetic transaction hash / signature string for relay header
            signed_payload = f"x402_sig_0x{signed_message.signature.hex()}"
            return True, signed_payload, None

        except Exception as e:
            return False, None, f"SIGNING_ERROR: {str(e)}"

_agent_wallet_instance = None

def get_agent_wallet() -> AgentWallet:
    global _agent_wallet_instance
    if _agent_wallet_instance is None:
        _agent_wallet_instance = AgentWallet()
    return _agent_wallet_instance
