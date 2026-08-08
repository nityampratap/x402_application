from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.db.models import PaymentLog
from app.schemas.payment import PaymentLogResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentLogResponse])
async def list_payment_logs(db: AsyncSession = Depends(get_db)):
    stmt = select(PaymentLog).order_by(PaymentLog.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/investigation/{investigation_id}", response_model=List[PaymentLogResponse])
async def get_payments_for_investigation(investigation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(PaymentLog).where(PaymentLog.investigation_id == investigation_id).order_by(PaymentLog.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
