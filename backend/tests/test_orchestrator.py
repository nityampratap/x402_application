import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.base import Base
from app.db.models import Investigation, InvestigationStatus, PaymentStatus
from app.orchestration.graph import WorkflowOrchestrator

@pytest.mark.asyncio
async def test_full_investigation_orchestration():
    # Set up in-memory sqlite db engine for fast hermetic integration testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    events_captured = []
    async def mock_event_callback(event_type, payload):
        events_captured.append((event_type, payload))

    async with AsyncSessionLocal() as session:
        # Create test investigation
        inv = Investigation(claim_text="Acme Corp acquired Startup XYZ for $50M in 2025")
        session.add(inv)
        await session.commit()
        await session.refresh(inv)

        # Run orchestrator
        orchestrator = WorkflowOrchestrator(db=session, event_callback=mock_event_callback)
        await orchestrator.run_investigation(inv.id)

        # Verify investigation outcome
        await session.refresh(inv)
        assert inv.status == InvestigationStatus.COMPLETED
        assert inv.overall_confidence_score is not None
        assert inv.overall_confidence_score > 0.0
        assert len(inv.agent_runs) >= 2
        assert len(inv.evidence_items) >= 1
        assert len(inv.payment_logs) >= 1

        # Verify event stream captured state changes
        event_types = [e[0] for e in events_captured]
        assert "STATE_CHANGE" in event_types
        assert "AGENT_LOG" in event_types
        assert "PAYMENT_EVENT" in event_types
        assert "EVIDENCE_ADDED" in event_types
