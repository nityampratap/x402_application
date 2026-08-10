import json
from typing import List, Dict, Any, Tuple
from app.core.config import get_settings

class EvidenceBudgetSelector:
    def __init__(self):
        self.settings = get_settings()

    async def estimate_value_scores(self, claim: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Estimates expected value score (0-100) per candidate evidence source using LLM or heuristic.
        """
        scored_candidates = []

        # Default cost mapping per agent_type
        default_costs = {
            "web_search": 0.001,
            "paid_news": 0.001,
            "financial_registry": 0.001,
            "paid_registry": 0.001
        }

        # Attempt LLM-assisted value score estimation if API key exists
        llm_scores = {}
        if self.settings.CLAUDE_API_KEY and not self.settings.CLAUDE_API_KEY.startswith("sk-ant-api03-template"):
            try:
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=self.settings.CLAUDE_API_KEY)

                prompt = (
                    f"Evaluate the expected information value score (0 to 100) for each candidate evidence source "
                    f"to investigate the following claim.\n\n"
                    f"Claim: \"{claim}\"\n\n"
                    f"Candidate Sources:\n"
                    + "\n".join([f"- Index {i}: [{c['agent_type']}] {c['question']}" for i, c in enumerate(candidates)])
                    + "\n\nReturn ONLY JSON matching schema: {\"scores\": [{\"index\": 0, \"value_score\": 85}, ...]}"
                )

                response = await client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=300,
                    messages=[{"role": "user", "content": prompt}]
                )
                parsed = json.loads(response.content[0].text)
                for item in parsed.get("scores", []):
                    idx = item.get("index")
                    val = item.get("value_score")
                    if idx is not None and val is not None:
                        llm_scores[idx] = float(val)
            except Exception as e:
                print(f"[BudgetSelector Notice] LLM scoring fallback used: {e}")

        # Fallback / heuristic scoring logic
        for i, c in enumerate(candidates):
            agent_type = c.get("agent_type", "web_search")
            cost = c.get("cost_usdc") or default_costs.get(agent_type, 0.001)

            if i in llm_scores:
                val_score = llm_scores[i]
            else:
                # Heuristic scoring based on agent type and claim keywords
                if "financial" in agent_type or "registry" in agent_type:
                    val_score = 92.0 if any(kw in claim.lower() for kw in ["earnings", "revenue", "m&a", "corp", "filing", "sec", "audit"]) else 75.0
                else:
                    val_score = 85.0 if any(kw in claim.lower() for kw in ["news", "report", "public", "press"]) else 70.0

            scored_candidates.append({
                "index": i,
                "question": c.get("question", ""),
                "agent_type": agent_type,
                "cost_usdc": cost,
                "value_score": round(val_score, 1)
            })

        return scored_candidates

    def select_knapsack(
        self, 
        candidates: List[Dict[str, Any]], 
        max_budget_usdc: float
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Exact 0/1 Knapsack optimization algorithm to select candidate sources that maximize
        total value score subject to total cost <= max_budget_usdc.
        """
        n = len(candidates)
        if n == 0:
            return [], []

        # Convert float costs to integer micro-cents (1 USDC = 1,000,000 micro-cents)
        SCALE = 1_000_000
        budget_cents = int(round(max_budget_usdc * SCALE))
        items_cost = [int(round(c["cost_usdc"] * SCALE)) for c in candidates]
        items_val = [int(round(c["value_score"])) for c in candidates]

        best_value = -1
        best_cost = float('inf')
        best_subset_mask = 0

        # Exact Brute-Force subset selection (N is small, N <= 10)
        total_subsets = 1 << n
        for mask in range(total_subsets):
            sub_cost = sum(items_cost[i] for i in range(n) if (mask & (1 << i)))
            if sub_cost <= budget_cents:
                sub_val = sum(items_val[i] for i in range(n) if (mask & (1 << i)))
                if sub_val > best_value or (sub_val == best_value and sub_cost < best_cost):
                    best_value = sub_val
                    best_cost = sub_cost
                    best_subset_mask = mask

        selected = []
        skipped = []

        for i in range(n):
            item = dict(candidates[i])
            if (best_subset_mask & (1 << i)):
                item["selection_status"] = "SELECTED"
                item["selection_reason"] = f"Optimal 0/1 Knapsack selection (Value: {item['value_score']}/100, Cost: ${item['cost_usdc']:.4f} USDC)"
                selected.append(item)
            else:
                item["selection_status"] = "SKIPPED"
                if item["cost_usdc"] > max_budget_usdc:
                    item["selection_reason"] = f"Exceeds max user budget of ${max_budget_usdc:.4f} USDC"
                else:
                    item["selection_reason"] = f"Skipped by 0/1 Knapsack optimization to maximize overall value density within ${max_budget_usdc:.4f} USDC budget"
                skipped.append(item)

        return selected, skipped

    def format_budget_decision_table(
        self, 
        claim: str, 
        max_budget_usdc: float, 
        selected: List[Dict[str, Any]], 
        skipped: List[Dict[str, Any]]
    ) -> str:
        """
        Renders a clean human-readable text table of the budget allocation decision.
        """
        all_items = selected + skipped
        all_items.sort(key=lambda x: x.get("index", 0))

        total_val = sum(x["value_score"] for x in selected)
        total_cost = sum(x["cost_usdc"] for x in selected)

        lines = []
        lines.append("=" * 80)
        lines.append("                EVIDENCEOS BUDGET ALLOCATION DECISION LOG")
        lines.append("=" * 80)
        lines.append(f"Claim: \"{claim}\"")
        lines.append(f"User Budget Limit: ${max_budget_usdc:.4f} USDC")
        lines.append(f"Optimal Total Spend: ${total_cost:.4f} USDC | Expected Value Score: {total_val:.1f} pts")
        lines.append("-" * 80)
        lines.append(f"{'#':<3} | {'Agent Type':<18} | {'Cost (USDC)':<11} | {'Value (0-100)':<13} | {'Status':<9} | {'Selection Reason'}")
        lines.append("-" * 80)

        for item in all_items:
            idx = item.get("index", 0) + 1
            agent = item.get("agent_type", "unknown")
            cost_str = f"${item.get('cost_usdc', 0.0):.4f}"
            val_str = f"{item.get('value_score', 0.0):.1f} / 100"
            status = item.get("selection_status", "SKIPPED")
            reason = item.get("selection_reason", "")
            lines.append(f"{idx:<3} | {agent:<18} | {cost_str:<11} | {val_str:<13} | {status:<9} | {reason}")

        lines.append("=" * 80)
        return "\n".join(lines)

_budget_selector_instance = None

def get_budget_selector() -> EvidenceBudgetSelector:
    global _budget_selector_instance
    if _budget_selector_instance is None:
        _budget_selector_instance = EvidenceBudgetSelector()
    return _budget_selector_instance
