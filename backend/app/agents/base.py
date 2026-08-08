from typing import Protocol, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class AgentResult:
    agent_name: str
    agent_type: str
    sub_question: str
    success: bool
    evidence_summary: str
    raw_data: Dict[str, Any]
    source_url: str
    is_paid_source: bool
    reliability_score: float  # 0.0 - 1.0
    error_message: Optional[str] = None
    execution_time_ms: int = 0
    tx_hash: Optional[str] = None
    amount_usdc: float = 0.0

class BaseEvidenceAgent(Protocol):
    name: str
    agent_type: str
    
    async def investigate(
        self, 
        sub_question: str, 
        context: Dict[str, Any]
    ) -> AgentResult:
        """Executes evidence gathering for a sub-question."""
        ...
