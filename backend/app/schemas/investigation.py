from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.db.models import InvestigationStatus
from app.schemas.evidence import EvidenceItemResponse
from app.schemas.payment import PaymentLogResponse

class InvestigationCreate(BaseModel):
    claim: str = Field(min_length=5, description="Claim text to autonomously investigate")

class AgentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    agent_name: str
    agent_type: str
    sub_question: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    claim_text: str
    status: InvestigationStatus
    overall_confidence_score: Optional[float] = None
    total_spend_usdc: float = 0.0
    created_at: datetime
    updated_at: datetime
    agent_runs: List[AgentRunResponse] = []
    evidence_items: List[EvidenceItemResponse] = []
    payment_logs: List[PaymentLogResponse] = []
