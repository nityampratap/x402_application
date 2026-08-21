import asyncio
from app.scoring.confidence import get_confidence_scorer
from app.orchestration.graph import WorkflowOrchestrator
from app.core.database import AsyncSessionLocal, engine
from app.db.base import Base
from app.db.models import Investigation

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    scorer = get_confidence_scorer()

    print("\n=======================================================")
    print("TESTING REAL AI DYNAMIC VERIFICATION ENGINE")
    print("=======================================================\n")

    # Claim 1: True / Real Claim
    claim_true = "Tesla reported Q2 2026 earnings results and financial update"
    ev_true = [
        {"content_summary": "Tesla releases Q2 financial results showing quarterly revenue and profit updates.", "reliability_score": 0.90, "is_paid": False},
        {"content_summary": "CNBC reported Tesla Q2 earnings with margins and cash flow details.", "reliability_score": 0.88, "is_paid": True}
    ]

    report_true = await scorer.calculate_confidence_async(claim_true, ev_true)
    print(f"CLAIM 1 (TRUE/VALID): \"{claim_true}\"")
    print(f"-> Evaluated Score: {int(report_true.overall_score * 100)}%")
    print(f"-> AI Verdict & Consensus: {report_true.consensus_summary}\n")

    # Claim 2: Fake / False Claim
    claim_false = "Elon Musk bought McDonald's for $500 Billion in cash"
    ev_false = [
        {"content_summary": "Google News Search: No official news or SEC filings exist regarding Elon Musk buying McDonald's.", "reliability_score": 0.15, "is_paid": False},
        {"content_summary": "Global Corporate Registry Search: No M&A transaction or filing found on record.", "reliability_score": 0.20, "is_paid": True}
    ]

    report_false = await scorer.calculate_confidence_async(claim_false, ev_false)
    print(f"CLAIM 2 (FALSE/REFUTED): \"{claim_false}\"")
    print(f"-> Evaluated Score: {int(report_false.overall_score * 100)}%")
    print(f"-> AI Verdict & Consensus: {report_false.consensus_summary}\n")

if __name__ == "__main__":
    asyncio.run(main())
