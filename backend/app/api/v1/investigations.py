import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, AsyncSessionLocal
from app.db.models import Investigation, InvestigationStatus
from app.schemas.investigation import InvestigationCreate, InvestigationResponse
from app.orchestration.graph import WorkflowOrchestrator
from app.api.v1.stream import sse_manager

router = APIRouter(prefix="/investigations", tags=["Investigations"])

async def _background_investigation_runner(investigation_id: str):
    async with AsyncSessionLocal() as db:
        orchestrator = WorkflowOrchestrator(
            db=db,
            event_callback=sse_manager.broadcast_event
        )
        await orchestrator.run_investigation(investigation_id)

@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
async def create_investigation(
    payload: InvestigationCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    investigation = Investigation(
        claim_text=payload.claim,
        status=InvestigationStatus.PENDING
    )
    db.add(investigation)
    await db.commit()
    await db.refresh(investigation)

    # Queue autonomous investigation execution in background
    background_tasks.add_task(_background_investigation_runner, investigation.id)

    return investigation

@router.get("", response_model=List[InvestigationResponse])
async def list_investigations(db: AsyncSession = Depends(get_db)):
    stmt = select(Investigation).order_by(Investigation.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Investigation).where(Investigation.id == investigation_id)
    res = await db.execute(stmt)
    investigation = res.scalar_one_or_none()
    
    if not investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Investigation '{investigation_id}' not found."
        )
    
    return investigation
