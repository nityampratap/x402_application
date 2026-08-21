from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ConfidenceReport:
    overall_score: float
    paid_evidence_weight: float
    free_evidence_weight: float
    reliability_average: float
    consensus_summary: str
    verdict: str = "INCONCLUSIVE"  # SUPPORTED, REFUTED, INCONCLUSIVE

class ConfidenceScorer:
    """
    Stance-aware confidence scorer.
    
    The score reflects whether evidence SUPPORTS or CONTRADICTS the claim,
    weighted by each source's reliability. Simply finding reliable sources
    that mention the topic does NOT mean the claim is true.
    """

    # Stance multipliers: how each stance affects the confidence direction
    STANCE_WEIGHTS = {
        "supports":     +1.0,   # Full positive weight
        "contradicts":  -1.0,   # Full negative weight (LOWERS confidence)
        "neutral":       0.0,   # No directional weight
        "insufficient":  0.0,   # No directional weight
    }

    def calculate_confidence(self, claim: str, evidence_items: List[Dict[str, Any]]) -> ConfidenceReport:
        if not evidence_items:
            return ConfidenceReport(
                overall_score=0.0,
                paid_evidence_weight=0.0,
                free_evidence_weight=0.0,
                reliability_average=0.0,
                consensus_summary="No evidence items gathered.",
                verdict="INCONCLUSIVE"
            )

        supports_score = 0.0
        contradicts_score = 0.0
        neutral_count = 0
        paid_count = 0
        free_count = 0
        total_reliability = 0.0

        for item in evidence_items:
            reliability = item.get("reliability_score", 0.5)
            is_paid = item.get("is_paid", False)
            stance = item.get("stance", "insufficient").lower()

            # Paid sources get 1.5x weight multiplier
            source_weight = 1.5 if is_paid else 1.0

            if is_paid:
                paid_count += 1
            else:
                free_count += 1

            total_reliability += reliability

            weighted_contribution = reliability * source_weight

            if stance == "supports":
                supports_score += weighted_contribution
            elif stance == "contradicts":
                contradicts_score += weighted_contribution
            else:
                neutral_count += 1

        total_items = len(evidence_items)
        avg_reliability = total_reliability / total_items if total_items > 0 else 0.0

        # --- Core scoring logic ---
        # Net directional score: positive means evidence supports, negative means contradicts
        total_directional = supports_score + contradicts_score  # contradicts_score is positive
        
        if total_directional == 0 and supports_score == 0 and contradicts_score == 0:
            # All evidence is neutral/insufficient — low confidence, inconclusive
            raw_score = 0.30
            verdict = "INCONCLUSIVE"
        elif supports_score > 0 and contradicts_score == 0:
            # Only supporting evidence found
            # Scale from 0.50 to 0.98 based on strength of support
            raw_score = min(0.50 + (supports_score / total_directional if total_directional > 0 else 0.5) * 0.48, 0.98)
            raw_score = min(0.50 + supports_score * 0.20, 0.98)
            verdict = "SUPPORTED"
        elif contradicts_score > 0 and supports_score == 0:
            # Only contradicting evidence found — claim is likely FALSE
            raw_score = max(0.50 - contradicts_score * 0.20, 0.02)
            verdict = "REFUTED"
        else:
            # Mixed evidence: both supporting and contradicting
            net_score = supports_score - contradicts_score
            if net_score > 0:
                # More support than contradiction
                ratio = supports_score / (supports_score + contradicts_score)
                raw_score = 0.40 + ratio * 0.40  # Range: 0.40 - 0.80
                verdict = "SUPPORTED" if ratio > 0.65 else "INCONCLUSIVE"
            elif net_score < 0:
                # More contradiction than support
                ratio = contradicts_score / (supports_score + contradicts_score)
                raw_score = 0.50 - ratio * 0.40  # Range: 0.10 - 0.50
                verdict = "REFUTED" if ratio > 0.65 else "INCONCLUSIVE"
            else:
                # Perfectly balanced — inconclusive
                raw_score = 0.40
                verdict = "INCONCLUSIVE"

        # Apply neutral evidence dampening: lots of neutral evidence = less certain
        if neutral_count > 0 and total_items > 0:
            neutral_ratio = neutral_count / total_items
            if neutral_ratio > 0.5:
                # More than half the evidence is neutral — dampen toward 0.35
                raw_score = raw_score * (1 - neutral_ratio * 0.3)

        normalized_score = round(min(max(raw_score, 0.02), 0.98), 2)

        # Build summary
        support_items = sum(1 for i in evidence_items if i.get("stance", "").lower() == "supports")
        contradict_items = sum(1 for i in evidence_items if i.get("stance", "").lower() == "contradicts")

        consensus_summary = (
            f"Analyzed {total_items} evidence sources ({paid_count} paid x402, {free_count} open web). "
            f"Stance breakdown: {support_items} supporting, {contradict_items} contradicting, {neutral_count} neutral/insufficient. "
            f"Verdict: {verdict}. Confidence: {int(normalized_score * 100)}%."
        )

        return ConfidenceReport(
            overall_score=normalized_score,
            paid_evidence_weight=paid_count * 1.5,
            free_evidence_weight=free_count * 1.0,
            reliability_average=round(avg_reliability, 2),
            consensus_summary=consensus_summary,
            verdict=verdict
        )

    async def calculate_confidence_async(self, claim: str, evidence_items: List[Dict[str, Any]]) -> ConfidenceReport:
        """
        Two-pass scoring:
        1. First compute stance-based score from agent-reported stances
        2. Then optionally refine with a final LLM judge call
        """
        # Pass 1: Stance-based scoring
        report = self.calculate_confidence(claim, evidence_items)
        
        if not evidence_items:
            return report

        # Pass 2: LLM Final Judge (refines the score using full context)
        try:
            from app.core.llm import get_llm_engine
            engine = get_llm_engine()

            ev_lines = []
            for i, item in enumerate(evidence_items):
                stance = item.get("stance", "insufficient")
                stance_reason = item.get("stance_reason", "N/A")
                source_type = "PAID x402" if item.get("is_paid") else "OPEN WEB"
                ev_lines.append(
                    f"- Evidence {i+1} [{source_type}] (Stance: {stance.upper()}): "
                    f"{item.get('content_summary', 'N/A')}\n"
                    f"  Stance Reason: {stance_reason}"
                )
            ev_block = "\n".join(ev_lines)

            prompt = (
                f"You are the Lead EvidenceOS Verification AI Judge.\n"
                f"Your job is to determine if the following claim is TRUE or FALSE based on the evidence.\n\n"
                f"TARGET CLAIM: \"{claim}\"\n\n"
                f"GATHERED EVIDENCE (with per-source stance analysis):\n{ev_block}\n\n"
                f"CRITICAL RULES:\n"
                f"- If evidence CONTRADICTS the claim, the claim is likely FALSE — score LOW (0.05-0.25).\n"
                f"- If evidence SUPPORTS the claim, the claim is likely TRUE — score HIGH (0.75-0.95).\n"
                f"- If evidence is mixed or neutral, score MODERATE (0.30-0.55).\n"
                f"- Do NOT give high scores just because reliable sources were found — check if they AGREE with the claim.\n"
                f"- A claim like 'Google has been shut down' with evidence that Google is operating normally should score VERY LOW.\n\n"
                f"Return ONLY valid JSON:\n{{\n"
                f"  \"verdict\": \"SUPPORTED\" | \"REFUTED\" | \"INCONCLUSIVE\",\n"
                f"  \"confidence_score\": 0.85,\n"
                f"  \"consensus_summary\": \"2-sentence explanation of your verdict\"\n"
                f"}}"
            )

            res_text = await engine.generate_completion(prompt, json_mode=True)
            if res_text:
                import json
                parsed = json.loads(res_text)
                ai_score = parsed.get("confidence_score")
                ai_summary = parsed.get("consensus_summary")
                ai_verdict = parsed.get("verdict", "EVALUATED")

                if ai_score is not None:
                    clean_score = round(min(max(float(ai_score), 0.02), 0.98), 2)
                    # Blend: 40% stance-based score + 60% LLM judge score
                    # This prevents pure LLM hallucination while giving it influence
                    blended = round(report.overall_score * 0.4 + clean_score * 0.6, 2)
                    report.overall_score = blended
                    report.reliability_average = clean_score

                if ai_verdict in ("SUPPORTED", "REFUTED", "INCONCLUSIVE"):
                    report.verdict = ai_verdict

                if ai_summary:
                    report.consensus_summary = (
                        f"[{report.verdict}] {ai_summary} "
                        f"(AI Judge Confidence: {int(report.overall_score * 100)}%)"
                    )

        except Exception as e:
            print(f"[ConfidenceScorer LLM Judge Error]: {e}")

        return report

_scorer_instance = None

def get_confidence_scorer() -> ConfidenceScorer:
    global _scorer_instance
    if _scorer_instance is None:
        _scorer_instance = ConfidenceScorer()
    return _scorer_instance
