"""
tests/test_x402_client_v2.py

Tests for x402 client success path and PAYMENT_FAILED path.

KNOWN BUGS DOCUMENTED (not fixed here, per instructions):
  - Bug 1: test_x402_client.py calls wallet.sign_x402_payment() which does not
    exist on AgentWallet. Those tests will AttributeError at collection time.
  - Bug 2: test_x402_client.py line 68 asserts error_code="PAYMENT_AUTHORIZATION_FAILED"
    but the client returns "WALLET_KEY_MISSING" for the no-key path. The
    existing assertion is wrong.
"""
import base64
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ------------------------------------------------------------------ #
#  Helpers                                                            #
# ------------------------------------------------------------------ #

def _make_payment_response_header(tx_hash: str) -> str:
    """Encode a payment-response header the way the server would."""
    payload = json.dumps({"transaction": tx_hash, "status": "success"})
    return base64.b64encode(payload.encode()).decode()


def _make_mock_response(
    status_code: int = 200,
    body: dict | None = None,
    tx_hash: str | None = None,
    content_type: str = "application/json",
) -> MagicMock:
    import httpx

    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.text = json.dumps(body or {})
    resp.json.return_value = body or {}
    headers: dict[str, str] = {"content-type": content_type}
    if tx_hash:
        headers["payment-response"] = _make_payment_response_header(tx_hash)
    resp.headers = headers
    return resp


# ------------------------------------------------------------------ #
#  PAYMENT_FAILED path — missing wallet key                           #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_paid_get_payment_failed_when_wallet_key_missing():
    """
    When the wallet has no configured private key, get_configured_x402_client()
    raises ValueError.  paid_get() must catch this and return a PaymentResult
    with success=False, status=PAYMENT_FAILED, error_code="WALLET_KEY_MISSING".
    """
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus

    client = X402Client()

    # Force the wallet to have no key so get_configured_x402_client raises
    with patch.object(client.wallet, "get_configured_x402_client", side_effect=ValueError("X402_PRIVATE_KEY is missing or invalid.")):
        result = await client.paid_get("http://localhost:8000/api/v1/any-endpoint")

    assert result.success is False
    assert result.status == PaymentStatus.PAYMENT_FAILED
    # Actual code sets this to "WALLET_KEY_MISSING" — not "PAYMENT_AUTHORIZATION_FAILED"
    assert result.error_code == "WALLET_KEY_MISSING"
    assert "WALLET_KEY_MISSING" in (result.error_code or "")


@pytest.mark.asyncio
async def test_paid_post_payment_failed_when_wallet_key_missing():
    """Same check for paid_post."""
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus

    client = X402Client()

    with patch.object(client.wallet, "get_configured_x402_client", side_effect=ValueError("X402_PRIVATE_KEY is missing or invalid.")):
        result = await client.paid_post("http://localhost:8000/api/v1/any-endpoint", json_data={"q": "test"})

    assert result.success is False
    assert result.status == PaymentStatus.PAYMENT_FAILED
    assert result.error_code == "WALLET_KEY_MISSING"


@pytest.mark.asyncio
async def test_paid_get_payment_failed_on_http_error_response():
    """
    If the wrapped client returns a non-200 status (e.g. 500), paid_get()
    must surface PAYMENT_FAILED with the right HTTP error code.
    """
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus
    from x402.http.clients.httpx import wrapHttpxWithPayment

    client = X402Client()
    mock_resp = _make_mock_response(status_code=500, body={"error": "internal"})

    mock_http_client = AsyncMock()
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)
    mock_http_client.get = AsyncMock(return_value=mock_resp)

    mock_x402_sdk = MagicMock()

    with patch.object(client.wallet, "get_configured_x402_client", return_value=mock_x402_sdk):
        with patch("app.x402.client.wrapHttpxWithPayment", return_value=mock_http_client):
            result = await client.paid_get("http://localhost:8000/api/v1/any-endpoint")

    assert result.success is False
    assert result.status == PaymentStatus.PAYMENT_FAILED
    assert result.error_code == "HTTP_500"


@pytest.mark.asyncio
async def test_paid_get_payment_failed_on_network_exception():
    """
    If wrapHttpxWithPayment raises (e.g. connection refused), paid_get()
    must return PAYMENT_FAILED with error_code "X402_CLIENT_ERROR".
    """
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus

    client = X402Client()

    mock_x402_sdk = MagicMock()

    # The context manager itself raises on __aenter__
    failing_cm = AsyncMock()
    failing_cm.__aenter__ = AsyncMock(side_effect=ConnectionRefusedError("refused"))
    failing_cm.__aexit__ = AsyncMock(return_value=False)

    with patch.object(client.wallet, "get_configured_x402_client", return_value=mock_x402_sdk):
        with patch("app.x402.client.wrapHttpxWithPayment", return_value=failing_cm):
            result = await client.paid_get("http://localhost:8000/api/v1/any-endpoint")

    assert result.success is False
    assert result.status == PaymentStatus.PAYMENT_FAILED
    assert result.error_code == "X402_CLIENT_ERROR"


# ------------------------------------------------------------------ #
#  SUCCESS path                                                        #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_paid_get_success_with_tx_hash():
    """
    When the server responds 200 and includes a valid payment-response header,
    paid_get() must return success=True, status=SUCCESS, and extract the tx_hash.
    """
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus

    EXPECTED_TX = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
    client = X402Client()

    mock_resp = _make_mock_response(
        status_code=200,
        body={"articles": [{"title": "Test article", "content": "Evidence text here."}]},
        tx_hash=EXPECTED_TX,
    )

    mock_http_client = AsyncMock()
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)
    mock_http_client.get = AsyncMock(return_value=mock_resp)

    mock_x402_sdk = MagicMock()

    with patch.object(client.wallet, "get_configured_x402_client", return_value=mock_x402_sdk):
        with patch("app.x402.client.wrapHttpxWithPayment", return_value=mock_http_client):
            result = await client.paid_get("http://localhost:8000/api/v1/paid-news", params={"q": "Tesla"})

    assert result.success is True
    assert result.status == PaymentStatus.SUCCESS
    assert result.tx_hash == EXPECTED_TX
    assert result.data is not None
    assert result.amount_usdc == 0.001


@pytest.mark.asyncio
async def test_paid_get_success_without_payment_header_is_not_required():
    """
    When the server responds 200 but there is NO payment-response header
    (e.g. a free endpoint that doesn't need payment), status is NOT_REQUIRED.
    """
    from app.x402.client import X402Client
    from app.x402.schemas import PaymentStatus

    client = X402Client()

    mock_resp = _make_mock_response(
        status_code=200,
        body={"result": "free data"},
        tx_hash=None,  # no payment-response header
    )

    mock_http_client = AsyncMock()
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)
    mock_http_client.get = AsyncMock(return_value=mock_resp)

    mock_x402_sdk = MagicMock()

    with patch.object(client.wallet, "get_configured_x402_client", return_value=mock_x402_sdk):
        with patch("app.x402.client.wrapHttpxWithPayment", return_value=mock_http_client):
            result = await client.paid_get("http://localhost:8000/api/v1/some-free-endpoint")

    assert result.success is True
    assert result.status == PaymentStatus.NOT_REQUIRED
    assert result.tx_hash is None


@pytest.mark.asyncio
async def test_paid_get_passes_query_params():
    """paid_get forwards the params dict to the underlying GET call."""
    from app.x402.client import X402Client

    client = X402Client()
    mock_resp = _make_mock_response(status_code=200, body={"ok": True})

    mock_http_client = AsyncMock()
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=False)
    mock_http_client.get = AsyncMock(return_value=mock_resp)

    mock_x402_sdk = MagicMock()

    with patch.object(client.wallet, "get_configured_x402_client", return_value=mock_x402_sdk):
        with patch("app.x402.client.wrapHttpxWithPayment", return_value=mock_http_client):
            await client.paid_get("http://localhost:8000/api/v1/paid-news", params={"q": "Apple", "page": 2})

    mock_http_client.get.assert_called_once_with(
        "http://localhost:8000/api/v1/paid-news",
        params={"q": "Apple", "page": 2},
    )


# ------------------------------------------------------------------ #
#  AgentWallet — no sign_x402_payment method (documents the bug)     #
# ------------------------------------------------------------------ #

def test_wallet_has_no_sign_x402_payment_method():
    """
    BUG 1 (documented): The old test_x402_client.py calls wallet.sign_x402_payment()
    which was removed when the wallet was refactored to use the x402 SDK.
    This test makes the absence explicit so the bug is visible in the run output.
    """
    from app.x402.wallet import AgentWallet
    wallet = AgentWallet()
    assert not hasattr(wallet, "sign_x402_payment"), (
        "sign_x402_payment was re-added to AgentWallet — "
        "remove test_x402_client.py's two tests that call it."
    )


def test_wallet_get_configured_x402_client_raises_without_key():
    """
    When private_key resolves to None, get_configured_x402_client() must
    raise ValueError, not silently succeed or return None.
    """
    from app.x402.wallet import AgentWallet
    from unittest.mock import PropertyMock

    wallet = AgentWallet()
    with patch.object(type(wallet), "account", new_callable=PropertyMock, return_value=None):
        with pytest.raises(ValueError, match="X402_PRIVATE_KEY is missing or invalid"):
            wallet.get_configured_x402_client()
