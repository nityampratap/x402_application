import pytest
import asyncio
from unittest.mock import patch, PropertyMock, MagicMock, AsyncMock
from app.x402.client import X402Client
from app.x402.schemas import PaymentStatus
from app.x402.wallet import AgentWallet

def test_wallet_signing_and_missing_key():
    # Wallet without private key should fail cleanly
    wallet = AgentWallet()
    with patch.object(type(wallet), "account", new_callable=PropertyMock, return_value=None):
        with pytest.raises(ValueError, match="X402_PRIVATE_KEY is missing or invalid"):
            wallet.get_configured_x402_client()

def test_wallet_signing_with_test_key():
    wallet = AgentWallet()
    from eth_account import Account
    test_acc = Account.from_key("0x0000000000000000000000000000000000000000000000000000000000000001")
    with patch.object(type(wallet), "account", new_callable=PropertyMock, return_value=test_acc):
        client = wallet.get_configured_x402_client()
        assert client is not None

@pytest.mark.asyncio
async def test_x402_client_payment_failed_state():
    client = X402Client()
    with patch.object(client.wallet, "get_configured_x402_client", side_effect=ValueError("X402_PRIVATE_KEY is missing or invalid.")):
        res = await client.paid_get("http://localhost:8000/api/v1/mock-x402-registry")
        assert res.success is False
        assert res.status == PaymentStatus.PAYMENT_FAILED
        assert res.error_code == "WALLET_KEY_MISSING"


