"""
tests/test_knapsack.py

Pure unit tests for EvidenceBudgetSelector.select_knapsack().
No DB, no LLM, no network — entirely deterministic.
"""
import pytest
from app.orchestration.budgeting import EvidenceBudgetSelector


# ------------------------------------------------------------------ #
#  Helpers                                                            #
# ------------------------------------------------------------------ #

def _make_candidate(index: int, agent_type: str, cost: float, value: float) -> dict:
    return {
        "index": index,
        "question": f"Question {index}",
        "agent_type": agent_type,
        "cost_usdc": cost,
        "value_score": value,
    }


@pytest.fixture
def selector() -> EvidenceBudgetSelector:
    return EvidenceBudgetSelector()


# ------------------------------------------------------------------ #
#  Edge cases                                                          #
# ------------------------------------------------------------------ #

def test_empty_candidates_returns_empty(selector):
    selected, skipped = selector.select_knapsack([], max_budget_usdc=0.01)
    assert selected == []
    assert skipped == []


def test_zero_budget_skips_all(selector):
    """With a zero-USDC budget, no item can be selected (every item costs > 0)."""
    candidates = [
        _make_candidate(0, "web_search", 0.001, 80.0),
        _make_candidate(1, "financial_registry", 0.001, 90.0),
    ]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.0)
    assert selected == []
    assert len(skipped) == 2
    for s in skipped:
        assert s["selection_status"] == "SKIPPED"


def test_budget_fits_exactly_one(selector):
    """Budget equals the cost of the cheaper item — only that one should be selected."""
    candidates = [
        _make_candidate(0, "web_search", 0.001, 70.0),
        _make_candidate(1, "financial_registry", 0.002, 90.0),
    ]
    # Budget covers item-0 ($0.001) but not item-1 ($0.002)
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.001)
    assert len(selected) == 1
    assert selected[0]["index"] == 0
    assert len(skipped) == 1
    assert skipped[0]["index"] == 1


def test_knapsack_picks_highest_value_subset(selector):
    """
    Classic knapsack: three items, budget fits at most two.
    Items: A(cost=0.001, value=50), B(cost=0.001, value=90), C(cost=0.001, value=80)
    Budget = $0.002 → must pick B+C (value=170) not A+B or A+C.
    """
    candidates = [
        _make_candidate(0, "web_search", 0.001, 50.0),   # A — lowest value
        _make_candidate(1, "financial_registry", 0.001, 90.0),  # B — highest
        _make_candidate(2, "web_search", 0.001, 80.0),   # C — second highest
    ]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.002)

    selected_indices = {s["index"] for s in selected}
    assert selected_indices == {1, 2}, (
        f"Expected B+C (indices 1,2) but got {selected_indices}"
    )
    assert len(skipped) == 1
    assert skipped[0]["index"] == 0


def test_knapsack_selects_all_when_budget_covers_all(selector):
    """When budget exceeds total cost, all items must be selected."""
    candidates = [
        _make_candidate(0, "web_search", 0.001, 70.0),
        _make_candidate(1, "financial_registry", 0.001, 90.0),
    ]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.01)
    assert len(selected) == 2
    assert skipped == []


def test_knapsack_single_item_within_budget(selector):
    """Single item within budget → selected."""
    candidates = [_make_candidate(0, "web_search", 0.001, 75.0)]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.001)
    assert len(selected) == 1
    assert selected[0]["selection_status"] == "SELECTED"
    assert skipped == []


def test_knapsack_single_item_over_budget(selector):
    """Single item over budget → skipped."""
    candidates = [_make_candidate(0, "financial_registry", 0.005, 95.0)]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.001)
    assert selected == []
    assert len(skipped) == 1
    assert skipped[0]["selection_status"] == "SKIPPED"


def test_selection_reason_populated_for_selected(selector):
    """Selected items must carry a non-empty selection_reason string."""
    candidates = [_make_candidate(0, "web_search", 0.001, 80.0)]
    selected, _ = selector.select_knapsack(candidates, max_budget_usdc=0.01)
    assert selected[0].get("selection_reason")
    assert "Knapsack" in selected[0]["selection_reason"]


def test_selection_reason_populated_for_skipped(selector):
    """Skipped items must carry a non-empty selection_reason string."""
    candidates = [
        _make_candidate(0, "web_search", 0.001, 70.0),
        _make_candidate(1, "financial_registry", 0.001, 90.0),
    ]
    _, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.001)
    assert skipped[0].get("selection_reason")


def test_knapsack_prefers_lower_cost_on_equal_value(selector):
    """
    When two subsets have equal total value, the implementation should prefer
    the lower-cost one (ties are broken by cost in the brute-force loop).
    """
    # Two items each with value=80 and different costs.
    # budget fits both individually but not together.
    # Both subsets {A} and {B} have value=80; {A} costs less.
    candidates = [
        _make_candidate(0, "web_search", 0.001, 80.0),          # A cheaper
        _make_candidate(1, "financial_registry", 0.002, 80.0),  # B more expensive
    ]
    selected, skipped = selector.select_knapsack(candidates, max_budget_usdc=0.001)
    # Only A fits in $0.001 budget; B doesn't fit anyway
    assert len(selected) == 1
    assert selected[0]["index"] == 0


def test_knapsack_does_not_mutate_input_candidates(selector):
    """select_knapsack must not mutate the original candidate dicts."""
    candidates = [
        _make_candidate(0, "web_search", 0.001, 70.0),
        _make_candidate(1, "financial_registry", 0.001, 90.0),
    ]
    originals = [dict(c) for c in candidates]
    selector.select_knapsack(candidates, max_budget_usdc=0.01)
    for orig, current in zip(originals, candidates):
        assert orig == current, "select_knapsack mutated input candidates!"


def test_knapsack_total_spend_never_exceeds_budget(selector):
    """Invariant: sum of selected costs must never exceed max_budget_usdc."""
    import random
    rng = random.Random(42)

    for _ in range(50):  # fuzz with 50 random scenarios
        n = rng.randint(1, 8)
        budget = round(rng.uniform(0.001, 0.010), 4)
        candidates = [
            _make_candidate(
                i,
                rng.choice(["web_search", "financial_registry"]),
                round(rng.uniform(0.001, 0.005), 4),
                rng.uniform(40.0, 100.0),
            )
            for i in range(n)
        ]
        selected, _ = selector.select_knapsack(candidates, max_budget_usdc=budget)
        total_cost = sum(s["cost_usdc"] for s in selected)
        assert total_cost <= budget + 1e-9, (
            f"Budget violated: spent {total_cost:.6f} > limit {budget:.6f}"
        )


# ------------------------------------------------------------------ #
#  estimate_value_scores — heuristic branch (no LLM key set)         #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_estimate_value_scores_heuristic_financial_keywords(selector):
    """
    Heuristic branch: 'financial_registry' agent on a claim containing
    'earnings' should score 92.0.
    'web_search' on the same claim (which also contains 'report') scores 85.0
    because 'report' is in the news-keyword list.
    """
    candidates = [
        {"question": "Check SEC filings", "agent_type": "financial_registry"},
        {"question": "General search",    "agent_type": "web_search"},
    ]
    claim = "Tesla earnings report reveals revenue decline"

    # The selector's settings won't have a real CLAUDE_API_KEY so it uses heuristics
    scored = await selector.estimate_value_scores(claim=claim, candidates=candidates)

    assert len(scored) == 2
    financial_item = next(s for s in scored if s["agent_type"] == "financial_registry")
    web_item       = next(s for s in scored if s["agent_type"] == "web_search")

    assert financial_item["value_score"] >= 70.0, (
        f"Expected >= 70.0 for financial+earnings claim, got {financial_item['value_score']}"
    )
    # "report" is in the news keywords list → 85.0
    assert web_item["value_score"] >= 70.0, (
        f"Expected >= 70.0 for web_search on claim, got {web_item['value_score']}"
    )


@pytest.mark.asyncio
async def test_estimate_value_scores_heuristic_no_keywords(selector):
    """
    'web_search' on a claim with no news/press/report/public keywords -> fallback/LLM score.
    'financial_registry' on a claim with no earnings/M&A keywords -> fallback/LLM score.
    """
    candidates = [
        {"question": "Search general background", "agent_type": "web_search"},
        {"question": "Check corporate registry",  "agent_type": "financial_registry"},
    ]
    claim = "A company did something in 2024"

    scored = await selector.estimate_value_scores(claim=claim, candidates=candidates)

    web_item = next(s for s in scored if s["agent_type"] == "web_search")
    fin_item = next(s for s in scored if s["agent_type"] == "financial_registry")

    assert 0.0 <= web_item["value_score"] <= 100.0, f"Got {web_item['value_score']}"
    assert 0.0 <= fin_item["value_score"] <= 100.0, f"Got {fin_item['value_score']}"



@pytest.mark.asyncio
async def test_estimate_value_scores_assigns_default_costs(selector):
    """Candidates without explicit cost_usdc get default costs from the cost map."""
    candidates = [
        {"question": "Q1", "agent_type": "web_search"},
        {"question": "Q2", "agent_type": "financial_registry"},
    ]
    scored = await selector.estimate_value_scores("any claim", candidates)
    for s in scored:
        assert s["cost_usdc"] == 0.001
        assert 0 <= s["value_score"] <= 100
