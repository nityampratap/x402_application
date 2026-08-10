import uvicorn
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from x402 import x402ResourceServer
from x402.http.facilitator_client import HTTPFacilitatorClient
from x402.mechanisms.evm.exact import register_exact_evm_server
from x402.http.middleware.fastapi import payment_middleware

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
    description="Autonomous Evidence Purchasing Platform powered by x402 Micropayments",
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

# Set up real x402 Facilitator client pointing to https://x402.org/facilitator
fac_client = HTTPFacilitatorClient(config={"url": settings.X402_FACILITATOR_URL})
x402_server = x402ResourceServer(facilitator_clients=fac_client)
register_exact_evm_server(x402_server)

# Protect both paywalled routes with official x402 payment_middleware
routes_config = {
    "GET /api/v1/registry": {
        "accepts": [
            {
                "scheme": "exact",
                "payTo": settings.recipient_address,
                "price": "$0.001",
                "network": "eip155:84532"
            }
        ]
    },
    "GET /api/v1/paid-news": {
        "accepts": [
            {
                "scheme": "exact",
                "payTo": settings.recipient_address,
                "price": "$0.001",
                "network": "eip155:84532"
            }
        ]
    }
}

app.middleware("http")(payment_middleware(routes=routes_config, server=x402_server))

# Mount API routers
app.include_router(api_router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "system": "EvidenceOS Core",
        "network": "Base Sepolia (84532)",
        "usdc_address": settings.USDC_CONTRACT_ADDRESS,
        "recipient_address": settings.recipient_address
    }

# Real x402 Paywalled Registry Endpoint
@app.get("/api/v1/registry", tags=["x402 Paywalled Provider"])
async def registry_endpoint(q: str = ""):
    return {
        "status": "VERIFIED_RECORD_ACCESS",
        "provider": "Global Financial & Corporate Registry",
        "query": q,
        "filing_id": "REG-SEPOLIA-2026-X402",
        "record_details": {
            "entity_name": "Acme Corp / Target Entity",
            "incorporation_date": "2021-03-15",
            "status": "ACTIVE_GOOD_STANDING",
            "certified_audit": "2025-12-31",
            "confirmed_m_and_a_filing": True
        }
    }

# Real x402 Paywalled News Endpoint — calls NewsAPI.org internally once payment clears
@app.get("/api/v1/paid-news", tags=["x402 Paywalled Provider"])
async def paid_news_endpoint(q: str = ""):
    articles = []
    source = "NewsAPI.org"
    error = None

    newsapi_key = settings.NEWSAPI_KEY
    if not newsapi_key:
        # Fallback: use GNews free public RSS as backup
        source = "GNews RSS (fallback)"
        try:
            import xml.etree.ElementTree as ET
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                rss_url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
                resp = await client.get(rss_url)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    for item in root.findall(".//item")[:5]:
                        articles.append({
                            "title": item.findtext("title", ""),
                            "url": item.findtext("link", ""),
                            "source": item.findtext("source", "Google News"),
                            "publishedAt": item.findtext("pubDate", "")
                        })
        except Exception as e:
            error = str(e)
    else:
        # Primary: call NewsAPI.org /v2/everything
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={"q": q, "pageSize": 5, "sortBy": "relevancy", "language": "en"},
                    headers={"X-Api-Key": newsapi_key}
                )
                data = resp.json()
                if data.get("status") == "ok":
                    for a in data.get("articles", [])[:5]:
                        articles.append({
                            "title": a.get("title", ""),
                            "url": a.get("url", ""),
                            "source": a.get("source", {}).get("name", ""),
                            "publishedAt": a.get("publishedAt", ""),
                            "description": a.get("description", "")
                        })
                else:
                    error = data.get("message", "NewsAPI returned non-ok status")
        except Exception as e:
            error = str(e)

    return {
        "status": "SUCCESS" if articles else "NO_RESULTS",
        "provider": source,
        "query": q,
        "article_count": len(articles),
        "articles": articles,
        "error": error
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
