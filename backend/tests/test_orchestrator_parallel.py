"""
tests/test_orchestrator_parallel.py

Tests that the WorkflowOrchestrator:
  1. Dispatches both web_search and financial_registry agents.
  2. Runs SELECTED agents in parallel (asyncio.gather), not sequentially.
  3. Aggregator (SCORING) fires only AFTER both agents complete.
  4. SKIPPED agents are recorded in the DB but never executed.
  5. Budget-constrained run: only selected agents are executed.

All external dependencies (LLM planner, LLM budget scorer, x402 client, real
agents) are mocked so the tests are hermetic, fast, and offline.
"""
import asyncio
import time
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.db.base import Base
from app.db.models import Investigation, InvestigationStatus
from app.agents.base import AgentResult
from app.orchestration.graph import WorkflowOrchestrator


# ------------------------------------------------------------------ #
#  Fixtures                                                            #
# ------------------------------------------------------------------ #

@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


def _fake_agent_result(agent_name: str, delay_s: float = 0.0) -> AgentResult:
    """Return a successful AgentResult with optional simulated delay (via side_effect)."""
    return AgentResult(
        agent_name=agent_name,
        agent_type=agent_name,
        sub_question=f"Q for {agent_name}",
        success=True,
        evidence_summary=f"Evidence from {agent_name}: confirmed.",
        raw_data={"detail": f"raw from {agent_name}"},
        source_url=f"http://localhost:8000/api/v1/{agent_name}",
        is_paid_source=True,
        reliability_score=0.9,
        tx_hash=f"0xabcdef_{agent_name[:4]}",
        amount_usdc=0.001,
    )


def _plan_stub(claim: str):
    """Return a fixed two-agent plan so the LLM is never called."""
    from app.orchestration.state import InvestigationPlan
    return InvestigationPlan(
        claim=claim,
        sub_questions=[
            {"question": "Web Q", "agent_type": "web_search"},
            {"question": "Fin Q", "agent_type": "financial_registry"},
        ],
    )


def _scored_candidates_stub():
    """Items as returned by EvidenceBudgetSelector.estimate_value_scores (no selection_status yet)."""
    return [
        {
            "index": 0,
            "question": "Web Q",
            "agent_type": "web_search",
            "cost_usdc": 0.001,
            "value_score": 70.0,
        },
        {
            "index": 1,
            "question": "Fin Q",
            "agent_type": "financial_registry",
            "cost_usdc": 0.001,
            "value_score": 90.0,
        },
    ]


def _tagged_selected_stub():
    """Items as returned by select_knapsack() — both selected."""
    return [
        {
            "index": 0,
            "question": "Web Q",
            "agent_type": "web_search",
            "cost_usdc": 0.001,
            "value_score": 70.0,
            "selection_status": "SELECTED",
            "selection_reason": "Optimal 0/1 Knapsack selection (Value: 70.0/100, Cost: $0.0010 USDC)",
        },
        {
            "index": 1,
            "question": "Fin Q",
            "agent_type": "financial_registry",
            "cost_usdc": 0.001,
            "value_score": 90.0,
            "selection_status": "SELECTED",
            "selection_reason": "Optimal 0/1 Knapsack selection (Value: 90.0/100, Cost: $0.0010 USDC)",
        },
    ]


# ------------------------------------------------------------------ #
#  Test 1 — Both agents are dispatched and complete                   #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_orchestrator_dispatches_both_agents(db_session):
    """
    Given a claim that generates two sub-questions (one per agent type),
    the orchestrator must create two AgentRun rows and both must be COMPLETED.
    """
    inv = Investigation(claim_text="Apple acquired Beats for $3B in 2014")
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    web_agent_mock = MagicMock()
    web_agent_mock.investigate = AsyncMock(return_value=_fake_agent_result("web_search"))

    fin_agent_mock = MagicMock()
    fin_agent_mock.investigate = AsyncMock(return_value=_fake_agent_result("financial_registry"))

    def _get_agent(agent_type, **kwargs):
        return web_agent_mock if agent_type == "web_search" else fin_agent_mock

    events = []

    async def _event_cb(event_type, payload):
        events.append(event_type)

    with patch("app.orchestration.graph.get_planner") as mock_planner_factory, \
         patch("app.orchestration.graph.get_budget_selector") as mock_budget_factory, \
         patch("app.orchestration.graph.AgentRegistry.get_agent", side_effect=_get_agent):

        mock_planner = MagicMock()
        mock_planner.create_plan = AsyncMock(return_value=_plan_stub(inv.claim_text))
        mock_planner_factory.return_value = mock_planner

        mock_budget = MagicMock()
        mock_budget.estimate_value_scores = AsyncMock(return_value=_scored_candidates_stub())
        mock_budget.select_knapsack = MagicMock(return_value=(_tagged_selected_stub(), []))
        mock_budget.format_budget_decision_table = MagicMock(return_value="TABLE")
        mock_budget_factory.return_value = mock_budget

        orchestrator = WorkflowOrchestrator(db=db_session, event_callback=_event_cb)
        await orchestrator.run_investigation(inv.id)

    await db_session.refresh(inv)
    assert inv.status == InvestigationStatus.COMPLETED
    assert len(inv.agent_runs) == 2
    completed = [ar for ar in inv.agent_runs if ar.status == "COMPLETED"]
    assert len(completed) == 2, f"Expected 2 COMPLETED, got {[(ar.agent_name, ar.status) for ar in inv.agent_runs]}"


# ------------------------------------------------------------------ #
#  Test 2 — Agents run in PARALLEL, not sequentially                  #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_orchestrator_runs_agents_in_parallel(db_session):
    """
    Each agent sleeps for DELAY seconds.  If they ran sequentially the total
    would be ≥ 2*DELAY.  With asyncio.gather they should finish in ≈ DELAY.
    We allow up to 1.8*DELAY to account for overhead, rejecting 2*DELAY.
    """
    DELAY = 0.15  # seconds

    async def slow_web(_sub_question, context):
        await asyncio.sleep(DELAY)
        return _fake_agent_result("web_search")

    async def slow_fin(_sub_question, context):
        await asyncio.sleep(DELAY)
        return _fake_agent_result("financial_registry")

    web_mock = MagicMock()
    web_mock.investigate = slow_web

    fin_mock = MagicMock()
    fin_mock.investigate = slow_fin

    def _get_agent(agent_type, **kwargs):
        return web_mock if agent_type == "web_search" else fin_mock

    inv = Investigation(claim_text="Tesla acquired SolarCity in 2016")
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    with patch("app.orchestration.graph.get_planner") as mp, \
         patch("app.orchestration.graph.get_budget_selector") as mb, \
         patch("app.orchestration.graph.AgentRegistry.get_agent", side_effect=_get_agent):

        mock_planner = MagicMock()
        mock_planner.create_plan = AsyncMock(return_value=_plan_stub(inv.claim_text))
        mp.return_value = mock_planner

        mock_budget = MagicMock()
        mock_budget.estimate_value_scores = AsyncMock(return_value=_scored_candidates_stub())
        mock_budget.select_knapsack = MagicMock(return_value=(_tagged_selected_stub(), []))
        mock_budget.format_budget_decision_table = MagicMock(return_value="TABLE")
        mb.return_value = mock_budget

        orchestrator = WorkflowOrchestrator(db=db_session)
        t0 = time.monotonic()
        await orchestrator.run_investigation(inv.id)
        elapsed = time.monotonic() - t0

    sequential_lower_bound = DELAY * 1.8  # if >= this, they ran sequentially
    assert elapsed < sequential_lower_bound, (
        f"Agents appear to have run sequentially: elapsed={elapsed:.3f}s "
        f"≥ sequential threshold {sequential_lower_bound:.3f}s. "
        f"asyncio.gather may not be working."
    )


# ------------------------------------------------------------------ #
#  Test 3 — SCORING fires only AFTER both agents complete             #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_scoring_fires_after_both_agents_complete(db_session):
    """
    The SCORING state-change event must appear in the event log only after
    both AGENT_COMPLETE events, never before.
    """
    completion_order = []

    async def agent_investigate_web(sub_question, context):
        await asyncio.sleep(0.05)
        completion_order.append("web_complete")
        return _fake_agent_result("web_search")

    async def agent_investigate_fin(sub_question, context):
        await asyncio.sleep(0.10)
        completion_order.append("fin_complete")
        return _fake_agent_result("financial_registry")

    web_mock = MagicMock()
    web_mock.investigate = agent_investigate_web

    fin_mock = MagicMock()
    fin_mock.investigate = agent_investigate_fin

    def _get_agent(agent_type, **kwargs):
        return web_mock if agent_type == "web_search" else fin_mock

    inv = Investigation(claim_text="Microsoft acquired LinkedIn for $26B in 2016")
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    events = []

    async def _event_cb(event_type, payload):
        inner = payload.get("payload", {})
        if event_type == "AGENT_COMPLETE":
            # Record which agent completed
            events.append(("AGENT_COMPLETE", inner.get("agent_name", "")))
        elif event_type == "STATE_CHANGE" and inner.get("status") == "SCORING":
            events.append(("STATE_CHANGE", "SCORING"))

    with patch("app.orchestration.graph.get_planner") as mp, \
         patch("app.orchestration.graph.get_budget_selector") as mb, \
         patch("app.orchestration.graph.AgentRegistry.get_agent", side_effect=_get_agent):

        mock_planner = MagicMock()
        mock_planner.create_plan = AsyncMock(return_value=_plan_stub(inv.claim_text))
        mp.return_value = mock_planner

        mock_budget = MagicMock()
        mock_budget.estimate_value_scores = AsyncMock(return_value=_scored_candidates_stub())
        mock_budget.select_knapsack = MagicMock(return_value=(_tagged_selected_stub(), []))
        mock_budget.format_budget_decision_table = MagicMock(return_value="TABLE")
        mb.return_value = mock_budget

        orchestrator = WorkflowOrchestrator(db=db_session, event_callback=_event_cb)
        await orchestrator.run_investigation(inv.id)

    event_types = [e[0] for e in events]
    assert "STATE_CHANGE" in event_types, "SCORING state-change event was never emitted"

    scoring_index = next(i for i, e in enumerate(events) if e == ("STATE_CHANGE", "SCORING"))
    agent_complete_indices = [i for i, e in enumerate(events) if e[0] == "AGENT_COMPLETE"]

    assert len(agent_complete_indices) == 2, (
        f"Expected 2 AGENT_COMPLETE events, got {len(agent_complete_indices)}"
    )
    assert all(idx < scoring_index for idx in agent_complete_indices), (
        f"SCORING fired before all agents completed!\n"
        f"Event log: {events}"
    )


# ------------------------------------------------------------------ #
#  Test 4 — SKIPPED agents are in DB but never executed              #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_skipped_agents_are_recorded_but_not_executed(db_session):
    """
    When the budget knapsack drops an agent, its AgentRun row must exist in
    the DB with status=SKIPPED and its investigate() must never be called.
    """
    # Build properly-tagged items as select_knapsack() would return them
    selected = [{
        "index": 1,
        "question": "Fin Q",
        "agent_type": "financial_registry",
        "cost_usdc": 0.001,
        "value_score": 90.0,
        "selection_status": "SELECTED",
        "selection_reason": "Optimal 0/1 Knapsack selection (Value: 90.0/100, Cost: $0.0010 USDC)",
    }]
    skipped = [{
        "index": 0,
        "question": "Web Q",
        "agent_type": "web_search",
        "cost_usdc": 0.001,
        "value_score": 70.0,
        "selection_status": "SKIPPED",
        "selection_reason": "Budget exceeded",
    }]

    fin_mock = MagicMock()
    fin_mock.investigate = AsyncMock(return_value=_fake_agent_result("financial_registry"))

    web_mock = MagicMock()
    web_mock.investigate = AsyncMock(return_value=_fake_agent_result("web_search"))

    def _get_agent(agent_type, **kwargs):
        return web_mock if agent_type == "web_search" else fin_mock

    inv = Investigation(claim_text="Amazon acquired Whole Foods for $13.7B in 2017")
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    with patch("app.orchestration.graph.get_planner") as mp, \
         patch("app.orchestration.graph.get_budget_selector") as mb, \
         patch("app.orchestration.graph.AgentRegistry.get_agent", side_effect=_get_agent):

        mock_planner = MagicMock()
        mock_planner.create_plan = AsyncMock(return_value=_plan_stub(inv.claim_text))
        mp.return_value = mock_planner

        mock_budget = MagicMock()
        mock_budget.estimate_value_scores = AsyncMock(return_value=_scored_candidates_stub())
        mock_budget.select_knapsack = MagicMock(return_value=(selected, skipped))
        mock_budget.format_budget_decision_table = MagicMock(return_value="TABLE")
        mb.return_value = mock_budget

        orchestrator = WorkflowOrchestrator(db=db_session)
        await orchestrator.run_investigation(inv.id)

    await db_session.refresh(inv)

    # Both AgentRuns must be in the DB
    assert len(inv.agent_runs) == 2, (
        f"Expected 2 agent_run rows (1 selected + 1 skipped), got {len(inv.agent_runs)}"
    )

    skipped_runs = [ar for ar in inv.agent_runs if ar.selection_status == "SKIPPED"]
    selected_runs = [ar for ar in inv.agent_runs if ar.selection_status == "SELECTED"]

    assert len(skipped_runs) == 1, f"Expected 1 SKIPPED run, got {skipped_runs}"
    assert len(selected_runs) == 1, f"Expected 1 SELECTED run, got {selected_runs}"

    # The skipped agent's investigate() must never have been called
    web_mock.investigate.assert_not_called()
    fin_mock.investigate.assert_called_once()


# ------------------------------------------------------------------ #
#  Test 5 — Event stream contains required event types in order      #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_full_event_stream_ordering(db_session):
    """
    A complete run must emit the following state-change sequence:
    PLANNING → AGENT_DISPATCH → IN_PROGRESS → SCORING → COMPLETED
    And must also contain BUDGET_ALLOCATION, AGENT_LOG, AGENT_START,
    AGENT_COMPLETE, PAYMENT_EVENT, EVIDENCE_ADDED events.
    """
    inv = Investigation(claim_text="Google acquired YouTube for $1.65B in 2006")
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    events = []

    async def _event_cb(event_type, payload):
        events.append((event_type, payload.get("payload", {}).get("status", "")))

    with patch("app.orchestration.graph.get_planner") as mp, \
         patch("app.orchestration.graph.get_budget_selector") as mb, \
         patch("app.orchestration.graph.AgentRegistry.get_agent") as mock_registry:

        mock_planner = MagicMock()
        mock_planner.create_plan = AsyncMock(return_value=_plan_stub(inv.claim_text))
        mp.return_value = mock_planner

        scored = _scored_candidates_stub()
        mock_budget = MagicMock()
        scored = _scored_candidates_stub()
        mock_budget.estimate_value_scores = AsyncMock(return_value=scored)
        mock_budget.select_knapsack = MagicMock(return_value=(_tagged_selected_stub(), []))
        mock_budget.format_budget_decision_table = MagicMock(return_value="TABLE")
        mb.return_value = mock_budget

        agent_mock = MagicMock()
        agent_mock.investigate = AsyncMock(side_effect=[
            _fake_agent_result("web_search"),
            _fake_agent_result("financial_registry"),
        ])
        mock_registry.return_value = agent_mock

        orchestrator = WorkflowOrchestrator(db=db_session, event_callback=_event_cb)
        await orchestrator.run_investigation(inv.id)

    all_event_types = [e[0] for e in events]
    state_changes = [e[1] for e in events if e[0] == "STATE_CHANGE"]

    # Required event types
    for required in ("STATE_CHANGE", "BUDGET_ALLOCATION", "AGENT_LOG",
                     "AGENT_START", "AGENT_COMPLETE",
                     "PAYMENT_EVENT", "EVIDENCE_ADDED"):
        assert required in all_event_types, f"Missing required event type: {required}"

    # Required state-change ordering
    expected_states = ["PLANNING", "AGENT_DISPATCH", "IN_PROGRESS", "SCORING", "COMPLETED"]
    for state in expected_states:
        assert state in state_changes, f"Missing state change: {state}"

    # Order check
    for i in range(len(expected_states) - 1):
        a, b = expected_states[i], expected_states[i + 1]
        assert state_changes.index(a) < state_changes.index(b), (
            f"State '{a}' must precede '{b}' but got order: {state_changes}"
        )
