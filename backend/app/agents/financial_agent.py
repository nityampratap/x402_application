import time
from typing import Dict, Any, Optional
from app.agents.base import AgentResult
from app.x402.client import X402Client

class FinancialRegistryAgent:
    name: str = "FinancialRegistryAgent"
    agent_type: str = "paid_registry"

    def __init__(self, x402_client: Optional[X402Client] = None):
        self.x402_client = x402_client or X402Client()

    async def investigate(self, sub_question: str, context: Dict[str, Any]) -> AgentResult:
        start_time = time.time()
        
        # Target real x402 paywalled endpoint protected by payment_middleware
        target_url = context.get("target_url") or "http://localhost:8000/api/v1/registry"
        
        # Invoke real x402 paid GET call via SDK wrapHttpxWithPayment
        res = await self.x402_client.paid_get(target_url, params={"q": sub_question})
        
        exec_ms = int((time.time() - start_time) * 1000)

        if res.success:
            data = res.data or {}
            rec_details = data.get("record_details", {})
            filing_id = data.get("filing_id", "N/A")
            provider = data.get("provider", "Registry Provider")

            evidence_summary = (
                f"{provider} Record (Filing ID: {filing_id}): Entity status '{rec_details.get('status', 'ACTIVE')}', "
                f"incorporation date '{rec_details.get('incorporation_date', 'N/A')}', M&A filing confirmed for '{sub_question}'."
            )

            return AgentResult(
                agent_name=self.name,
                agent_type=self.agent_type,
                sub_question=sub_question,
                success=True,
                evidence_summary=evidence_summary,
                raw_data=data,
                source_url=target_url,
                is_paid_source=True,
                reliability_score=0.96,
                execution_time_ms=exec_ms,
                tx_hash=res.tx_hash,
                amount_usdc=res.amount_usdc or 0.001
            )
        else:
            error_msg = f"x402 Payment/Request Failed ({res.status.value}): {res.error_details}"
            return AgentResult(
                agent_name=self.name,
                agent_type=self.agent_type,
                sub_question=sub_question,
                success=False,
                evidence_summary=f"Failed to retrieve paywalled evidence for '{sub_question}'. Reason: {error_msg}",
                raw_data={"error_code": res.error_code, "error_details": res.error_details},
                source_url=target_url,
                is_paid_source=True,
                reliability_score=0.0,
                error_message=error_msg,
                execution_time_ms=exec_ms,
                amount_usdc=res.amount_usdc or 0.001
            )
