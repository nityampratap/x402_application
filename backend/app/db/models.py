import uuid
from datetime import datetime
import enum
from typing import List, Optional
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class InvestigationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PLANNING = "PLANNING"
    AGENT_DISPATCH = "AGENT_DISPATCH"
    IN_PROGRESS = "IN_PROGRESS"
    SCORING = "SCORING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PLANNING_FAILED = "PLANNING_FAILED"

class PaymentStatus(str, enum.Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    HTTP_ERROR = "HTTP_ERROR"

class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[InvestigationStatus] = mapped_column(
        SQLEnum(InvestigationStatus), default=InvestigationStatus.PENDING, nullable=False
    )
    overall_confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_spend_usdc: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_budget_usdc: Mapped[float] = mapped_column(Float, default=0.01, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    agent_runs: Mapped[List["AgentRun"]] = relationship("AgentRun", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    evidence_items: Mapped[List["EvidenceItem"]] = relationship("EvidenceItem", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")
    payment_logs: Mapped[List["PaymentLog"]] = relationship("PaymentLog", back_populates="investigation", cascade="all, delete-orphan", lazy="selectin")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    sub_question: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="RUNNING", nullable=False)
    estimated_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_cost_usdc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    selection_status: Mapped[str] = mapped_column(String(20), default="SELECTED", nullable=False)
    selection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="agent_runs")
    evidence_items: Mapped[List["EvidenceItem"]] = relationship("EvidenceItem", back_populates="agent_run", lazy="selectin")
    payment_logs: Mapped[List["PaymentLog"]] = relationship("PaymentLog", back_populates="agent_run", lazy="selectin")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), nullable=False)
    agent_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    content_summary: Mapped[str] = mapped_column(Text, nullable=False)
    raw_data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reliability_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    stance: Mapped[Optional[str]] = mapped_column(String(20), default="insufficient", nullable=True)
    stance_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="evidence_items")
    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="evidence_items")


class PaymentLog(Base):
    __tablename__ = "payment_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), nullable=False)
    agent_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    endpoint_url: Mapped[str] = mapped_column(Text, nullable=False)
    amount_usdc: Mapped[float] = mapped_column(Float, nullable=False)
    asset_address: Mapped[str] = mapped_column(String(42), nullable=False)
    network: Mapped[str] = mapped_column(String(50), nullable=False)
    tx_hash: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), nullable=False)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    investigation: Mapped["Investigation"] = relationship("Investigation", back_populates="payment_logs")
    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="payment_logs")
