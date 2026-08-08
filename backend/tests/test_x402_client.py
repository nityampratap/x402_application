import pytest
import asyncio
from app.x402.client import X402Client
from app.x402.schemas import PaymentStatus
from app.x402.wallet import AgentWallet

def test_wallet_signing_and_missing_key():
    # Wallet without private key should fail cleanly
    wallet = AgentWallet()
    wallet.private_key = None
    wallet.account = None

    success, payload, reason = wallet.sign_x402_payment(
        pay_to="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amount_usdc=0.15,
        asset_address="0x036Cb52701cb08910E44913b865d06799f7f93b3",
        network="base-sepolia"
    )

    assert success is False
    assert payload is None
    assert "WALLET_KEY_MISSING" in reason

def test_wallet_signing_with_test_key():
    wallet = AgentWallet()
    # Use a dummy test private key
    wallet.private_key = "0x0000000000000000000000000000000000000000000000000000000000000001"
    from eth_account import Account
    wallet.account = Account.from_key(wallet.private_key)

    success, payload, reason = wallet.sign_x402_payment(
        pay_to="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amount_usdc=0.15,
        asset_address="0x036Cb52701cb08910E44913b865d06799f7f93b3",
        network="base-sepolia"
    )

    assert success is True
    assert payload.startswith("x402_sig_0x")
    assert reason is None

@pytest.mark.asyncio
async def test_x402_client_payment_failed_state(mocker=None):
    from unittest.mock import AsyncMock, patch, MagicMock
    import httpx

    client = X402Client()
    client.wallet.private_key = None
    client.wallet.account = None

    mock_402_response = MagicMock(spec=httpx.Response)
    mock_402_response.status_code = 402
    mock_402_response.headers = {
        "X-PAYMENT-REQUIRED": "amount=0.15,payTo=0x742d35Cc6634C0532925a3b844Bc454e4438f44e,asset=0x036Cb52701cb08910E44913b865d06799f7f93b3,network=base-sepolia"
    }
    mock_402_response.json.return_value = {"error": "PAYMENT_REQUIRED"}

    mock_async_client = AsyncMock()
    mock_async_client.__aenter__.return_value = mock_async_client
    mock_async_client.get.return_value = mock_402_response

    with patch("httpx.AsyncClient", return_value=mock_async_client):
        # Invoking a paid endpoint without a wallet key must yield PAYMENT_FAILED status (never fake success!)
        res = await client.paid_get("http://localhost:8000/api/v1/mock-x402-registry")
        
        assert res.success is False
        assert res.status == PaymentStatus.PAYMENT_FAILED
        assert res.error_code == "PAYMENT_AUTHORIZATION_FAILED"

