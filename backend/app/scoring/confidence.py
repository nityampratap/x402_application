from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ConfidenceReport:
    overall_score: float
    paid_evidence_weight: float
    free_evidence_weight: float
    reliability_average: float
    consensus_summary: str

class ConfidenceScorer:
    def calculate_confidence(self, claim: str, evidence_items: List[Dict[str, Any]]) -> ConfidenceReport:
        if not evidence_items:
            return ConfidenceReport(
                overall_score=0.0,
                paid_evidence_weight=0.0,
                free_evidence_weight=0.0,
                reliability_average=0.0,
                consensus_summary="No evidence items gathered."
            )

        total_weight = 0.0
        total_score = 0.0
        paid_count = 0
        free_count = 0

        for item in evidence_items:
            reliability = item.get("reliability_score", 0.5)
            is_paid = item.get("is_paid", False)
            
            # Paid evidence items receive higher confidence weight (1.5x) due to cryptographic verification
            weight = 1.5 if is_paid else 1.0
            
            if is_paid:
                paid_count += 1
            else:
                free_count += 1

            total_weight += weight
            total_score += (reliability * weight)

        raw_score = total_score / total_weight if total_weight > 0 else 0.0
        normalized_score = round(min(max(raw_score, 0.0), 1.0), 2)

        consensus_summary = (
            f"Analyzed {len(evidence_items)} evidence sources ({paid_count} paid x402 records, {free_count} open web). "
            f"Confidence score evaluated at {int(normalized_score * 100)}%."
        )

        return ConfidenceReport(
            overall_score=normalized_score,
            paid_evidence_weight=paid_count * 1.5,
            free_evidence_weight=free_count * 1.0,
            reliability_average=round(raw_score, 2),
            consensus_summary=consensus_summary
        )

_scorer_instance = None

def get_confidence_scorer() -> ConfidenceScorer:
    global _scorer_instance
    if _scorer_instance is None:
        _scorer_instance = ConfidenceScorer()
    return _scorer_instance
