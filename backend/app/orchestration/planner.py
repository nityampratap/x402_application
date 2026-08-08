import os
import json
from typing import Dict, Any, List
from app.orchestration.state import InvestigationPlan
from app.core.config import get_settings

class ClaimPlanner:
    def __init__(self):
        self.settings = get_settings()

    async def create_plan(self, claim: str) -> InvestigationPlan:
        # Fallback intelligent decomposition
        sub_questions: List[Dict[str, str]] = [
            {
                "question": f"Gather public web reports and news background regarding: '{claim}'",
                "agent_type": "web_search"
            },
            {
                "question": f"Query official paid financial registry for verified transaction data regarding: '{claim}'",
                "agent_type": "financial_registry"
            }
        ]

        if self.settings.CLAUDE_API_KEY and not self.settings.CLAUDE_API_KEY.startswith("sk-ant-api03-template"):
            try:
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=self.settings.CLAUDE_API_KEY)
                
                prompt = (
                    f"Decompose the following claim into 2 distinct investigation sub-questions: "
                    f"1 for open web search (agent_type: 'web_search') and 1 for official paid financial/corporate registry (agent_type: 'financial_registry').\n"
                    f"Claim: \"{claim}\"\n"
                    f"Return ONLY valid JSON matching schema: {{\n"
                    f"  \"sub_questions\": [\n"
                    f"    {{\"question\": \"...\", \"agent_type\": \"web_search\"}},\n"
                    f"    {{\"question\": \"...\", \"agent_type\": \"financial_registry\"}}\n"
                    f"  ]\n"
                    f"}}"
                )

                message = await client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=300,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                res_text = message.content[0].text
                parsed = json.loads(res_text)
                if "sub_questions" in parsed and len(parsed["sub_questions"]) > 0:
                    sub_questions = parsed["sub_questions"]
            except Exception as e:
                print(f"[ClaimPlanner Notice] Claude API decomposition fallback used: {e}")

        return InvestigationPlan(claim=claim, sub_questions=sub_questions)

_planner_instance = None

def get_planner() -> ClaimPlanner:
    global _planner_instance
    if _planner_instance is None:
        _planner_instance = ClaimPlanner()
    return _planner_instance
