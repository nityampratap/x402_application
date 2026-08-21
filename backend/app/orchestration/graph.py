import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Investigation, AgentRun, EvidenceItem, PaymentLog, InvestigationStatus, PaymentStatus
from app.orchestration.planner import get_planner
from app.orchestration.budgeting import get_budget_selector
from app.agents.registry import AgentRegistry
from app.x402.client import X402Client
from app.scoring.confidence import get_confidence_scorer

class WorkflowOrchestrator:
    def __init__(self, db: AsyncSession, event_callback: Optional[Callable[[str, Dict[str, Any]], None]] = None):
        self.db = db
        self.planner = get_planner()
        self.budget_selector = get_budget_selector()
        self.scorer = get_confidence_scorer()
        self.event_callback = event_callback

    async def emit_event(self, event_type: str, investigation_id: str, payload: Dict[str, Any]):
        if self.event_callback:
            try:
                await self.event_callback(event_type, {
                    "event_type": event_type,
                    "investigation_id": investigation_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "payload": payload
                })
            except Exception as e:
                print(f"[Event Emission Error]: {e}")

    async def run_investigation(self, investigation_id: str):
        # 1. Fetch Investigation from DB
        stmt = select(Investigation).where(Investigation.id == investigation_id)
        res = await self.db.execute(stmt)
        investigation = res.scalar_one_or_none()

        if not investigation:
            return

        # Status: PLANNING
        investigation.status = InvestigationStatus.PLANNING
        await self.db.commit()
        await self.emit_event("STATE_CHANGE", investigation_id, {"status": "PLANNING"})

        # 2. Planning Node
        plan = await self.planner.create_plan(investigation.claim_text, image_url=investigation.image_url or "")
        
        # 2b. Evidence Budgeting & 0/1 Knapsack Optimization Node
        scored_candidates = await self.budget_selector.estimate_value_scores(
            claim=investigation.claim_text, 
            candidates=plan.sub_questions
        )

        selected_items, skipped_items = self.budget_selector.select_knapsack(
            candidates=scored_candidates, 
            max_budget_usdc=investigation.max_budget_usdc
        )

        # Print budget decision log to stdout for real run visibility
        table_log = self.budget_selector.format_budget_decision_table(
            claim=investigation.claim_text,
            max_budget_usdc=investigation.max_budget_usdc,
            selected=selected_items,
            skipped=skipped_items
        )
        print("\n" + table_log + "\n")

        # Emit SSE event for Budget Allocation
        await self.emit_event("BUDGET_ALLOCATION", investigation_id, {
            "max_budget_usdc": investigation.max_budget_usdc,
            "selected_count": len(selected_items),
            "skipped_count": len(skipped_items),
            "selected_items": selected_items,
            "skipped_items": skipped_items
        })

        # Status: AGENT_DISPATCH
        investigation.status = InvestigationStatus.AGENT_DISPATCH
        await self.db.commit()
        await self.emit_event("STATE_CHANGE", investigation_id, {
            "status": "AGENT_DISPATCH", 
            "selected_agents_count": len(selected_items),
            "skipped_agents_count": len(skipped_items)
        })

        # Create AgentRun DB entries for all items (selected and skipped)
        agent_runs: List[AgentRun] = []
        all_allocated = selected_items + skipped_items
        all_allocated.sort(key=lambda x: x.get("index", 0))

        for item in all_allocated:
            is_selected = (item["selection_status"] == "SELECTED")
            ar = AgentRun(
                investigation_id=investigation_id,
                agent_name=f"{item['agent_type'].title()}Agent",
                agent_type=item["agent_type"],
                sub_question=item["question"],
                status="RUNNING" if is_selected else "SKIPPED",
                estimated_value=item["value_score"],
                estimated_cost_usdc=item["cost_usdc"],
                selection_status=item["selection_status"],
                selection_reason=item["selection_reason"],
                completed_at=datetime.utcnow() if not is_selected else None
            )
            self.db.add(ar)
            agent_runs.append(ar)

        await self.db.commit()
        for ar in agent_runs:
            await self.db.refresh(ar)
            status_msg = f"Dispatched agent {ar.agent_name}" if ar.selection_status == "SELECTED" else f"Skipped agent {ar.agent_name} ({ar.selection_reason})"
            await self.emit_event("AGENT_LOG", investigation_id, {
                "message": f"{status_msg} for question: '{ar.sub_question}'",
                "agent_run_id": ar.id,
                "selection_status": ar.selection_status,
                "value_score": ar.estimated_value,
                "cost_usdc": ar.estimated_cost_usdc
            })

        # 3. Agent Execution Node (IN_PROGRESS)
        investigation.status = InvestigationStatus.IN_PROGRESS
        await self.db.commit()
        await self.emit_event("STATE_CHANGE", investigation_id, {"status": "IN_PROGRESS"})

        collected_evidence: List[Dict[str, Any]] = []
        total_spend = 0.0

        async def execute_agent(ar):
            x402_client = X402Client(
                db_session=self.db,
                investigation_id=investigation_id,
                agent_run_id=ar.id
            )
            agent_instance = AgentRegistry.get_agent(ar.agent_type, x402_client=x402_client)
            
            await self.emit_event("AGENT_START", investigation_id, {
                "agent_name": ar.agent_name,
                "sub_question": ar.sub_question
            })
            
            result = await agent_instance.investigate(
                sub_question=ar.sub_question,
                context={
                    "investigation_id": investigation_id,
                    "agent_run_id": ar.id,
                    "original_claim": investigation.claim_text,
                    "image_url": investigation.image_url
                }
            )
            
            await self.emit_event("AGENT_COMPLETE", investigation_id, {
                "agent_name": ar.agent_name,
                "success": result.success
            })
            
            return ar, result

        tasks = []
        for ar in agent_runs:
            # Skip execution if item was filtered out by budget knapsack optimization
            if ar.selection_status != "SELECTED":
                continue
            tasks.append(execute_agent(ar))

        # Run selected agents in parallel
        execution_results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in execution_results:
            if isinstance(res, Exception):
                print(f"[WorkflowOrchestrator] Agent execution error: {res}")
                continue
            
            ar, result = res

            # Record AgentRun completion
            ar.status = "COMPLETED" if result.success else "FAILED"
            ar.completed_at = datetime.utcnow()
            if result.error_message:
                ar.error_message = result.error_message

            # Save PaymentLog if this was a paid attempt
            if result.is_paid_source:
                payment_status = PaymentStatus.SUCCESS if result.success else PaymentStatus.PAYMENT_FAILED
                pay_log = PaymentLog(
                    investigation_id=investigation_id,
                    agent_run_id=ar.id,
                    endpoint_url=result.source_url,
                    amount_usdc=result.amount_usdc,
                    asset_address="0x036Cb52701cb08910E44913b865d06799f7f93b3",
                    network="base-sepolia",
                    tx_hash=result.tx_hash,
                    status=payment_status,
                    failure_reason=result.error_message if not result.success else None
                )
                self.db.add(pay_log)
                total_spend += result.amount_usdc
                
                await self.emit_event("PAYMENT_EVENT", investigation_id, {
                    "payment_log": {
                        "endpoint_url": result.source_url,
                        "amount_usdc": result.amount_usdc,
                        "status": payment_status.value,
                        "tx_hash": result.tx_hash,
                        "failure_reason": result.error_message
                    }
                })

            # Save EvidenceItem if evidence obtained
            if result.evidence_summary:
                ev_item = EvidenceItem(
                    investigation_id=investigation_id,
                    agent_run_id=ar.id,
                    source_url=result.source_url,
                    is_paid=result.is_paid_source,
                    content_summary=result.evidence_summary,
                    reliability_score=result.reliability_score,
                    stance=result.stance,
                    stance_reason=result.stance_reason
                )
                self.db.add(ev_item)
                collected_evidence.append({
                    "content_summary": result.evidence_summary,
                    "reliability_score": result.reliability_score,
                    "is_paid": result.is_paid_source,
                    "stance": result.stance,
                    "stance_reason": result.stance_reason
                })

                await self.emit_event("EVIDENCE_ADDED", investigation_id, {
                    "evidence": {
                        "source_url": result.source_url,
                        "is_paid": result.is_paid_source,
                        "content_summary": result.evidence_summary,
                        "reliability_score": result.reliability_score,
                        "stance": result.stance,
                        "stance_reason": result.stance_reason
                    }
                })

            await self.db.commit()

        # 4. Scoring Node (SCORING)
        investigation.status = InvestigationStatus.SCORING
        await self.db.commit()
        await self.emit_event("STATE_CHANGE", investigation_id, {"status": "SCORING"})

        score_report = await self.scorer.calculate_confidence_async(investigation.claim_text, collected_evidence)

        # 5. Completion
        investigation.status = InvestigationStatus.COMPLETED
        investigation.overall_confidence_score = score_report.overall_score
        investigation.total_spend_usdc = round(total_spend, 4)
        await self.db.commit()

        await self.emit_event("STATE_CHANGE", investigation_id, {
            "status": "COMPLETED",
            "overall_confidence_score": score_report.overall_score,
            "total_spend_usdc": investigation.total_spend_usdc,
            "consensus_summary": score_report.consensus_summary
        })
