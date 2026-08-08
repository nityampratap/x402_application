import asyncio
import threading
import time
import httpx
import uvicorn
from eth_account import Account
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from x402 import x402Client, x402ResourceServer
from x402.http.facilitator_client import HTTPFacilitatorClient
from x402.mechanisms.evm.exact import register_exact_evm_client, register_exact_evm_server
from x402.http.middleware.fastapi import payment_middleware
from x402.http.clients.httpx import wrapHttpxWithPayment

app = FastAPI()

routes = {
    "GET /api/v1/paid-evidence": {
        "accepts": [
            {
                "scheme": "exact",
                "payTo": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "price": "$0.001",
                "network": "eip155:84532"
            }
        ]
    }
}

fac = HTTPFacilitatorClient(config={"url": "https://x402.org/facilitator"})
server = x402ResourceServer(facilitator_clients=fac)
register_exact_evm_server(server)

app.middleware("http")(payment_middleware(routes=routes, server=server))

@app.get("/api/v1/paid-evidence")
async def paid_evidence_endpoint(request: Request):
    return {
        "status": "SUCCESS",
        "data": "Verified real x402 paywalled evidence data",
        "timestamp": "2026-08-08T11:30:00Z"
    }

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")

async def main():
    print("Starting local server thread...")
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(1.5)

    test_key = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a6f363852"
    account = Account.from_key(test_key)
    print(f"Client Wallet Address: {account.address}")

    x402_client = x402Client()
    register_exact_evm_client(x402_client, account)

    async with wrapHttpxWithPayment(x402_client, base_url="http://127.0.0.1:8001", timeout=45.0) as client:
        try:
            print("Making paid GET request to /api/v1/paid-evidence via wrapHttpxWithPayment...")
            resp = await client.get("/api/v1/paid-evidence")
            print(f"\n==========================================")
            print(f"Final Response Status Code: {resp.status_code}")
            print(f"Final Response Body: {resp.text}")
            print(f"Final Response Headers: {dict(resp.headers)}")
            print(f"==========================================\n")
        except Exception as e:
            print(f"\nPayment execution exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
