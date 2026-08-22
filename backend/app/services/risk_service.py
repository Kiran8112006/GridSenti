"""
GridSenti — app/services/risk_service.py
=========================================
Prototype Risk Engine Service.

Consumes existing detection evidence (ML probability, Rule score, and per-node packet persistence).
Categorizes risk into LOW (0-34), MEDIUM (35-69), and CRITICAL (70-100) with recommended actions.

NOTE: Prototype thresholds & weights — requires field validation.
Does NOT implement actual physical power isolation.
"""

from __future__ import annotations

import threading
from typing import Dict, List, Tuple


class RiskEngineService:
    """
    Prototype Risk Engine with per-node persistence tracking.
    """

    # Configurable weighting scheme (sums to 1.0)
    ML_WEIGHT: float = 0.40
    RULE_WEIGHT: float = 0.30
    PERSISTENCE_WEIGHT: float = 0.30

    # Risk Level thresholds (Prototype thresholds — requires field validation)
    LOW_THRESHOLD: float = 34.0
    MEDIUM_THRESHOLD: float = 69.0

    # Recommended Actions
    ACTION_CONTINUE_MONITORING = "CONTINUE_MONITORING"
    ACTION_INVESTIGATE_NODE = "INVESTIGATE_NODE"
    ACTION_UTILITY_ISOLATION = "UTILITY_ALERT_AND_ISOLATION_RECOMMENDATION"

    def __init__(self):
        self._lock = threading.Lock()
        # Per-node persistence counter: node_id -> consecutive fault count
        self._node_persistence: Dict[str, int] = {}

    def get_persistence(self, node_id: str) -> int:
        with self._lock:
            return self._node_persistence.get(node_id, 0)

    def update_persistence(self, node_id: str, is_fault: bool) -> int:
        with self._lock:
            if is_fault:
                current = self._node_persistence.get(node_id, 0) + 1
                self._node_persistence[node_id] = current
            else:
                current = 0
                self._node_persistence[node_id] = 0
            return current

    def calculate_risk(
        self,
        node_id: str,
        ml_hif_prob: float,
        rule_score: float,
        is_fault: bool,
    ) -> Dict:
        """
        Calculate composite risk score (0-100), level, and component breakdown.

        Parameters
        ----------
        node_id : str
        ml_hif_prob : float (0.0 to 1.0)
        rule_score : float (0.0 to 100.0)
        is_fault : bool (True if detection indicates HIF or line fault)
        """
        # Update and fetch persistence count
        persistence_count = self.update_persistence(node_id, is_fault)

        # 1. ML Component (0-100 scale, weighted 40%)
        ml_comp_raw = min(100.0, max(0.0, ml_hif_prob * 100.0))
        ml_evidence = ml_comp_raw * self.ML_WEIGHT

        # 2. Rule Component (0-100 scale, weighted 30%)
        rule_comp_raw = min(100.0, max(0.0, rule_score))
        rule_evidence = rule_comp_raw * self.RULE_WEIGHT

        # 3. Persistence Component (weighted 30%)
        # 0 -> 0%, 1 -> 33.3%, 2 -> 66.7%, 3+ -> 100%
        if persistence_count == 0:
            pers_comp_raw = 0.0
        elif persistence_count == 1:
            pers_comp_raw = 33.3
        elif persistence_count == 2:
            pers_comp_raw = 66.7
        else:
            pers_comp_raw = 100.0

        persistence_evidence = pers_comp_raw * self.PERSISTENCE_WEIGHT

        # Total Composite Risk Score (0-100)
        total_risk_score = round(ml_evidence + rule_evidence + persistence_evidence, 1)
        total_risk_score = min(100.0, max(0.0, total_risk_score))

        # Determine Risk Level & Recommended Action
        if total_risk_score >= self.MEDIUM_THRESHOLD:
            level = "CRITICAL"
            recommended_action = self.ACTION_UTILITY_ISOLATION
        elif total_risk_score >= self.LOW_THRESHOLD:
            level = "MEDIUM"
            recommended_action = self.ACTION_INVESTIGATE_NODE
        else:
            level = "LOW"
            recommended_action = self.ACTION_CONTINUE_MONITORING

        # Construct Transparent Reasons
        reasons = []
        if ml_hif_prob >= 0.50:
            reasons.append(f"High ML fault probability ({ml_hif_prob:.2f})")
        elif ml_hif_prob >= 0.20:
            reasons.append(f"Elevated ML fault probability ({ml_hif_prob:.2f})")

        if rule_score >= 60.0:
            reasons.append(f"Severe rule anomaly score ({rule_score:.1f}/100)")
        elif rule_score >= 20.0:
            reasons.append(f"Moderate rule anomaly score ({rule_score:.1f}/100)")

        if persistence_count >= 3:
            reasons.append(f"Persistent fault condition across {persistence_count} consecutive packets")
        elif persistence_count >= 1:
            reasons.append(f"Fault condition observed in packet (Count: {persistence_count})")

        if not reasons:
            reasons.append("Nominal electrical metrics and stable baseline operation.")

        return {
            "level": level,
            "score": total_risk_score,
            "components": {
                "mlEvidence": round(ml_evidence, 1),
                "ruleEvidence": round(rule_evidence, 1),
                "persistenceEvidence": round(persistence_evidence, 1),
            },
            "persistenceCount": persistence_count,
            "reasons": reasons,
            "recommendedAction": recommended_action,
        }


# Singleton service instance
risk_service = RiskEngineService()
