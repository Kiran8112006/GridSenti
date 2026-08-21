"""
GridSenti — app/services/explanation_service.py
================================================
Deterministic Explainability Engine Foundation.

Generates transparent, evidence-based text explanations derived strictly from ML predictions,
rule engine shift reasons, risk score, and persistence counts.

DESIGN NOTE:
This module provides a clean interface (`generate_explanation`). In a future roadmap phase,
an external LLM (e.g. Gemini API adapter) can replace this deterministic template generator
without breaking any backend or frontend consumers.
"""

from __future__ import annotations

from typing import Dict, List, Optional


class ExplanationService:
    """
    Deterministic Evidence-Driven Explanation Generator.
    """

    def generate_explanation(
        self,
        node_id: str,
        binary_classification: str,
        ml_hif_prob: float,
        fault_type: str,
        rule_score: float,
        rule_reasons: List[str],
        risk_level: str,
        risk_score: float,
        persistence_count: int,
        recommended_action: str,
    ) -> Dict:
        """
        Generate structured evidence-based explanation.
        """
        evidence: List[str] = []

        # 1. Model Evidence
        evidence.append(
            f"Random Forest HIF Classifier probability: {ml_hif_prob * 100:.1f}% "
            f"(Target class: {fault_type})"
        )

        # 2. Rule Engine Evidence
        if rule_reasons:
            for r in rule_reasons:
                if r != "No significant energy imbalance shift or spread anomaly detected.":
                    evidence.append(f"Rule Engine Filter: {r}")
        else:
            evidence.append("Rule Engine Filter: Baseline DWT energy ratios stable.")

        # 3. Persistence Evidence
        if persistence_count > 0:
            evidence.append(
                f"Packet Persistence: Condition observed across {persistence_count} "
                f"consecutive 2-second telemetry packets."
            )
        else:
            evidence.append("Packet Persistence: 0 (Normal steady-state condition).")

        # 4. Summary Text
        if binary_classification == "HIF" or risk_level in ["MEDIUM", "CRITICAL"]:
            summary = (
                f"GridSenti flagged a {risk_level} risk {fault_type} anomaly at {node_id} "
                f"(Risk Score: {risk_score:.1f}/100). The Random Forest model predicted "
                f"{fault_type} with {ml_hif_prob * 100:.1f}% probability and rule score {rule_score:.1f}/100. "
                f"Condition persisted across {persistence_count} packet(s)."
            )
        else:
            summary = (
                f"GridSenti verified nominal operating conditions at {node_id} "
                f"(Risk Score: {risk_score:.1f}/100, Level: LOW). DWT energy feature ratios "
                f"remain stable within steady-state normal bounds."
            )

        return {
            "summary": summary,
            "evidence": evidence,
            "recommendedAction": recommended_action,
        }


# Singleton service instance
explanation_service = ExplanationService()
