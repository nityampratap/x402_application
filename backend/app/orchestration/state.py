from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class InvestigationPlan:
    claim: str
    sub_questions: List[Dict[str, str]] # list of {"question": str, "agent_type": str}

@dataclass
class InvestigationState:
    investigation_id: str
    claim: str
    status: str = "PENDING"
    plan: Optional[InvestigationPlan] = None
    agent_results: List[Dict[str, Any]] = field(default_factory=list)
    confidence_score: Optional[float] = None
    total_spend_usdc: float = 0.0
    error_message: Optional[str] = None
