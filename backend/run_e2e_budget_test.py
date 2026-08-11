import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.db.base import Base
from app.db.models import Investigation, InvestigationStatus
from app.orchestration.graph import WorkflowOrchestrator
from app.orchestration.budgeting import EvidenceBudgetSelector

async def main():
    # Initialize DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("\n" + "=" * 80)
    print("      EVIDENCEOS EVIDENCE BUDGETING & 0/1 KNAPSACK OPTIMIZATION TEST")
    print("=" * 80 + "\n")

    # 1. Test EvidenceBudgetSelector Knapsack Logic Directly
    selector = EvidenceBudgetSelector()

    claim_text = "Acme Corp completed a $5.8B acquisition of CyberShield Security in 2026"
    candidates = [
        {
            "question": "Query public web news reports for Acme Corp acquisition press release",
            "agent_type": "web_search",
            "cost_usdc": 0.001
        },
        {
            "question": "Query official corporate financial registry for verified M&A filing",
            "agent_type": "financial_registry",
            "cost_usdc": 0.002
        },
        {
            "question": "Query premium paid news archive for executive statements",
            "agent_type": "paid_news",
            "cost_usdc": 0.003
        }
    ]

    print("--- 1. Evaluating LLM Value Scores for Candidate Sources ---")
    scored = await selector.estimate_value_scores(claim_text, candidates)
    for s in scored:
        print(f"  * Source [{s['agent_type']}]: Value Score = {s['value_score']}/100 | Estimated Cost = ${s['cost_usdc']:.4f} USDC")

    # Test Knapsack Selection with Constrained Budget ($0.0025 USDC)
    budget_limit = 0.0025
    selected, skipped = selector.select_knapsack(scored, max_budget_usdc=budget_limit)

    table_output = selector.format_budget_decision_table(
        claim=claim_text,
        max_budget_usdc=budget_limit,
        selected=selected,
        skipped=skipped
    )
    print("\n" + table_output + "\n")

    # 2. Run Real Investigation End-to-End through WorkflowOrchestrator with DB Persistence
    print("--- 2. Running Real End-to-End Investigation via WorkflowOrchestrator ---")
    async with AsyncSessionLocal() as db:
        inv = Investigation(
            claim_text=claim_text,
            max_budget_usdc=0.002, # Constrained budget allowing select subset
            status=InvestigationStatus.PENDING
        )
        db.add(inv)
        await db.commit()
        await db.refresh(inv)

        event_logs = []
        async def mock_event_callback(event_type: str, payload: dict):
            # Print in real-time
            ts = payload.get("timestamp", "")
            agent = payload.get("payload", {}).get("agent_name", "")
            msg = f"[{ts}] EVENT: {event_type}"
            if agent:
                msg += f" (Agent: {agent})"
            print(msg)
            event_logs.append(msg)

        orchestrator = WorkflowOrchestrator(db=db, event_callback=mock_event_callback)
        import time
        start_t = time.time()
        await orchestrator.run_investigation(inv.id)
        end_t = time.time()
        print(f"\nTotal Orchestration Time: {end_t - start_t:.2f} seconds")

        # Reload investigation details
        await db.refresh(inv)
        print("\n============================================================")
        print(f"Investigation ID:       {inv.id}")
        print(f"Status:                 {inv.status.value}")
        print(f"Max Budget Allocated:   ${inv.max_budget_usdc:.4f} USDC")
        print(f"Total Actual Spend:     ${inv.total_spend_usdc:.4f} USDC")
        print(f"Overall Confidence:     {inv.overall_confidence_score:.1f}%")
        print("\nAgent Runs Log:")
        for ar in inv.agent_runs:
            print(f"  - [{ar.selection_status}] {ar.agent_name}: Status={ar.status} | Value={ar.estimated_value}/100 | Cost=${ar.estimated_cost_usdc:.4f} USDC")
            print(f"    Reason: {ar.selection_reason}")

        print("\nPayment Logs:")
        for pl in inv.payment_logs:
            print(f"  - Endpoint: {pl.endpoint_url} | Status: {pl.status.value} | Amount: ${pl.amount_usdc:.4f} USDC")
            print(f"    Tx Hash:  {pl.tx_hash}")

        print("============================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
