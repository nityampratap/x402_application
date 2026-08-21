from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.db.models import InvestigationStatus
from app.schemas.evidence import EvidenceItemResponse
from app.schemas.payment import PaymentLogResponse

class InvestigationCreate(BaseModel):
    claim: str = Field(min_length=3, description="Claim text to autonomously investigate")
    max_budget_usdc: Optional[float] = Field(default=0.01, description="Maximum budget allocated in USDC")
    image_url: Optional[str] = Field(default=None, description="Optional image reference URL for visual verification")

class AgentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    agent_name: str
    agent_type: str
    sub_question: str
    status: str
    estimated_value: Optional[float] = None
    estimated_cost_usdc: Optional[float] = None
    selection_status: str = "SELECTED"
    selection_reason: Optional[str] = None
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
    max_budget_usdc: float = 0.01
    created_at: datetime
    updated_at: datetime
    agent_runs: List[AgentRunResponse] = []
    evidence_items: List[EvidenceItemResponse] = []
    payment_logs: List[PaymentLogResponse] = []
