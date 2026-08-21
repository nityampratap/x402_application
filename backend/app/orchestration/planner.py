import os
import json
import re
from typing import Dict, Any, List
from app.orchestration.state import InvestigationPlan
from app.core.config import get_settings

class ClaimPlanner:
    def __init__(self):
        self.settings = get_settings()

    async def create_plan(self, claim: str, image_url: str = "") -> InvestigationPlan:
        claim_lower = claim.lower()
        is_corporate = any(kw in claim_lower for kw in ["corp", "inc", "ltd", "acquisition", "acquired", "m&a", "merger", "earnings", "revenue", "sec", "filing", "profit", "shares", "stock", "fund", "valuation", "bankrupt"])
        has_image = bool(image_url and image_url.strip()) or any(kw in claim_lower for kw in ["image", "photo", "picture", "screenshot", "chart", "diagram", "document scan"])

        sub_questions = []
        if is_corporate:
            sub_questions.append({
                "question": f"Gather public web reports and media coverage regarding: '{claim}'",
                "agent_type": "web_search"
            })
            sub_questions.append({
                "question": f"Query official paid financial registry for verified corporate filings regarding: '{claim}'",
                "agent_type": "financial_registry"
            })
        else:
            sub_questions.append({
                "question": f"Search live news reports and official statements regarding: '{claim}'",
                "agent_type": "web_search"
            })
            sub_questions.append({
                "question": f"Verify public background details and press reports regarding: '{claim}'",
                "agent_type": "web_search"
            })

        if has_image:
            sub_questions.append({
                "question": f"Perform multimodal visual analysis and visual verification on image reference regarding: '{claim}'",
                "agent_type": "image_analysis"
            })

        prompt = (
            f"Decompose the following claim into targeted investigation sub-questions.\n"
            f"Claim: \"{claim}\"\n"
            f"Image Reference Provided: {bool(image_url)}\n\n"
            f"Available agent_types: 'web_search' (news, articles), 'financial_registry' (corporate SEC filings), 'image_analysis' (for visual document/photo verification).\n"
            f"Return ONLY valid JSON matching schema: {{\n"
            f"  \"sub_questions\": [\n"
            f"    {{\"question\": \"...\", \"agent_type\": \"web_search\"}}\n"
            f"  ]\n"
            f"}}"
        )

        from app.core.llm import get_llm_engine
        engine = get_llm_engine()
        res_text = await engine.generate_completion(prompt, json_mode=True)
        if res_text:
            try:
                parsed = json.loads(res_text)
                if "sub_questions" in parsed and len(parsed["sub_questions"]) > 0:
                    sub_questions = parsed["sub_questions"]
            except Exception as e:
                print(f"[ClaimPlanner Notice] LLM JSON parse fallback used: {e}")

        return InvestigationPlan(claim=claim, sub_questions=sub_questions)

_planner_instance = None

def get_planner() -> ClaimPlanner:
    global _planner_instance
    if _planner_instance is None:
        _planner_instance = ClaimPlanner()
    return _planner_instance
