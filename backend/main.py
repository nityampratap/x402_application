import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine
from app.db.base import Base
from app.api.router import api_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="EvidenceOS Backend API",
    description="Autonomous Evidence Purchasing & Verification Platform powered by x402 Micropayments",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "system": "EvidenceOS Core",
        "network": "Base Sepolia (84532)",
        "usdc_address": settings.USDC_CONTRACT_ADDRESS
    }

# Mock x402 Paywalled Registry Endpoint for Local Demo & E2E Testing
@app.get("/api/v1/mock-x402-registry", tags=["x402 Mock Provider"])
async def mock_x402_registry(request: Request, q: str = ""):
    payment_header = request.headers.get("X-PAYMENT") or request.headers.get("x-payment")
    
    # If no X-PAYMENT authorization header present, return HTTP 402 Payment Required
    if not payment_header:
        headers = {
            "X-PAYMENT-REQUIRED": f"amount=0.15,payTo={settings.recipient_address},asset={settings.USDC_CONTRACT_ADDRESS},network=base-sepolia"
        }
        return Response(
            content='{"error": "PAYMENT_REQUIRED", "message": "Paywalled record access requires 0.15 USDC via x402 protocol"}',
            status_code=402,
            media_type="application/json",
            headers=headers
        )

    # Verification of X-PAYMENT header
    return {
        "status": "VERIFIED_RECORD_ACCESS",
        "provider": "Global Financial & Corporate Registry",
        "query": q,
        "filing_id": "REG-2025-9941-X402",
        "transaction_verified": True,
        "payment_auth": payment_header[:24] + "...",
        "record_details": {
            "entity_name": "Target Entity Corp",
            "incorporation_date": "2021-03-15",
            "status": "ACTIVE_GOOD_STANDING",
            "last_certified_audit": "2025-12-31"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
