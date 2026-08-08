from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass

class PaymentStatus(str, Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    HTTP_ERROR = "HTTP_ERROR"

@dataclass
class PaymentChallenge:
    amount_usdc: float
    asset_address: str
    network: str
    pay_to_address: str
    scheme: str
    raw_headers: Dict[str, str]

@dataclass
class PaymentResult:
    success: bool
    status: PaymentStatus
    http_status_code: int
    data: Optional[Dict[str, Any]] = None
    tx_hash: Optional[str] = None
    amount_usdc: Optional[float] = None
    challenge: Optional[PaymentChallenge] = None
    error_code: Optional[str] = None
    error_details: Optional[str] = None
