from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.db.models import PaymentStatus

class PaymentLogCreate(BaseModel):
    investigation_id: str
    agent_run_id: str
    endpoint_url: str
    amount_usdc: float
    asset_address: str
    network: str
    status: PaymentStatus = PaymentStatus.PENDING
    tx_hash: Optional[str] = None
    failure_reason: Optional[str] = None

class PaymentLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    agent_run_id: str
    endpoint_url: str
    amount_usdc: float
    asset_address: str
    network: str
    tx_hash: Optional[str]
    status: PaymentStatus
    failure_reason: Optional[str]
    created_at: datetime
