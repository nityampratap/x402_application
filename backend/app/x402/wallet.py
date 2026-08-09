from typing import Optional
from eth_account import Account
from x402 import x402Client
from x402.mechanisms.evm.exact import register_exact_evm_client
from app.core.config import get_settings

class AgentWallet:
    def __init__(self):
        self.settings = get_settings()

    @property
    def account(self) -> Optional[Account]:
        pk = self.settings.active_private_key
        if not pk:
            return None
        try:
            return Account.from_key(pk)
        except Exception:
            return None

    @property
    def address(self) -> Optional[str]:
        acc = self.account
        return acc.address if acc else None

    def get_configured_x402_client(self) -> x402Client:
        acc = self.account
        if not acc:
            raise ValueError("X402_PRIVATE_KEY is missing or invalid.")
        client = x402Client()
        register_exact_evm_client(client, acc)
        return client

_agent_wallet_instance = None

def get_agent_wallet() -> AgentWallet:
    global _agent_wallet_instance
    if _agent_wallet_instance is None:
        _agent_wallet_instance = AgentWallet()
    return _agent_wallet_instance
