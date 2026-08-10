import time
from typing import Dict, Any, Optional
from app.agents.base import AgentResult
from app.x402.client import X402Client

class WebSearchAgent:
    name: str = "WebSearchAgent"
    agent_type: str = "paid_news"

    def __init__(self, x402_client: Optional[X402Client] = None, **kwargs):
        self.x402_client = x402_client or X402Client()

    async def investigate(self, sub_question: str, context: Dict[str, Any]) -> AgentResult:
        start_time = time.time()

        # Target real x402 paywalled news endpoint
        target_url = context.get("news_url") or "http://localhost:8000/api/v1/paid-news"

        # Invoke real x402 paid GET via SDK wrapHttpxWithPayment
        res = await self.x402_client.paid_get(target_url, params={"q": sub_question})

        exec_ms = int((time.time() - start_time) * 1000)

        if res.success:
            data = res.data or {}
            articles = data.get("articles", [])
            provider = data.get("provider", "News Provider")
            article_count = data.get("article_count", 0)

            if articles:
                headlines = []
                source_url = articles[0].get("url", target_url)
                for a in articles[:5]:
                    title = a.get("title", "")
                    src = a.get("source", "")
                    if title:
                        headlines.append(f"{title} ({src})" if src else title)

                evidence_summary = (
                    f"Paid news search via {provider} for '{sub_question}' "
                    f"retrieved {article_count} articles: " + " | ".join(headlines)
                )
            else:
                source_url = target_url
                evidence_summary = (
                    f"Paid news search via {provider} for '{sub_question}' "
                    f"returned no matching articles."
                )

            return AgentResult(
                agent_name=self.name,
                agent_type=self.agent_type,
                sub_question=sub_question,
                success=True,
                evidence_summary=evidence_summary,
                raw_data=data,
                source_url=source_url,
                is_paid_source=True,
                reliability_score=0.88,
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
                evidence_summary=f"Failed to retrieve paid news evidence for '{sub_question}'. Reason: {error_msg}",
                raw_data={"error_code": res.error_code, "error_details": res.error_details},
                source_url=target_url,
                is_paid_source=True,
                reliability_score=0.0,
                error_message=error_msg,
                execution_time_ms=exec_ms,
                amount_usdc=res.amount_usdc or 0.001
            )
