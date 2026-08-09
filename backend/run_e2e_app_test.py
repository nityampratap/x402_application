import asyncio
from app.agents.financial_agent import FinancialRegistryAgent
from app.x402.client import X402Client

async def main():
    print("Executing end-to-end FinancialRegistryAgent test against real backend app...")
    
    client = X402Client()
    agent = FinancialRegistryAgent(x402_client=client)

    context = {"target_url": "http://localhost:8000/api/v1/registry"}
    result = await agent.investigate(sub_question="Acme Corp M&A corporate filings", context=context)

    print("\n==========================================")
    print(f"Agent Name: {result.agent_name}")
    print(f"Success: {result.success}")
    print(f"Evidence Summary: {result.evidence_summary}")
    print(f"Transaction Hash (tx_hash): {result.tx_hash}")
    print(f"Source URL: {result.source_url}")
    print(f"Is Paid Source: {result.is_paid_source}")
    print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(main())
