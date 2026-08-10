import asyncio
from app.agents.web_agent import WebSearchAgent
from app.x402.client import X402Client

async def main():
    print("=" * 60)
    print("E2E Test: WebSearchAgent via /api/v1/paid-news (x402)")
    print("=" * 60)

    client = X402Client()
    agent = WebSearchAgent(x402_client=client)

    context = {"news_url": "http://localhost:8000/api/v1/paid-news"}
    result = await agent.investigate(
        sub_question="Tesla quarterly earnings 2026",
        context=context
    )

    print(f"\nAgent Name:        {result.agent_name}")
    print(f"Agent Type:        {result.agent_type}")
    print(f"Success:           {result.success}")
    print(f"Is Paid Source:    {result.is_paid_source}")
    print(f"Transaction Hash:  {result.tx_hash}")
    print(f"Amount USDC:       {result.amount_usdc}")
    print(f"Source URL:        {result.source_url}")
    print(f"Exec Time (ms):    {result.execution_time_ms}")
    print(f"\nEvidence Summary:\n{result.evidence_summary}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
