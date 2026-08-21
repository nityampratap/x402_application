from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class EvidenceItemCreate(BaseModel):
    investigation_id: str
    agent_run_id: str
    source_url: str
    is_paid: bool = False
    content_summary: str
    raw_data_json: Optional[str] = None
    reliability_score: float = 0.5
    stance: Optional[str] = "insufficient"
    stance_reason: Optional[str] = None

class EvidenceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    agent_run_id: str
    source_url: str
    is_paid: bool
    content_summary: str
    reliability_score: float
    stance: Optional[str] = "insufficient"
    stance_reason: Optional[str] = None
    created_at: datetime
