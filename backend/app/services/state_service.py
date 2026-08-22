"""
GridSenti — In-Memory State & Heartbeat Manager
===============================================
Thread-safe in-memory store for node statuses, heartbeats, active alerts,
latest telemetry, multi-class predictions, risk scores, localization,
explanations, isolation simulation, public warnings, and system events.
"""

from __future__ import annotations

import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.schemas.telemetry import (
    TelemetryRequest,
    DetectionResultSchema,
    FaultClassificationSchema,
    RiskSchema,
    LocalizationSchema,
    ExplanationSchema,
    IsolationStatusSchema,
    PublicWarningSchema,
    NodeStatusSchema,
    AlertSchema,
    EventSchema,
)

from ml.multiclass_predict import predict_multiclass_fault
from app.services.risk_service import risk_service
from app.services.localization_service import localization_service
from app.services.explanation_service import explanation_service
from app.services.isolation_service import isolation_service
from app.services.public_warning_service import public_warning_service

# Heartbeat timeout in seconds (configurable, default 10s)
HEARTBEAT_TIMEOUT_SECONDS = 10.0


class StateService:
    def __init__(self):
        self._lock = threading.RLock()

        # Seed initial registered nodes
        self._nodes: Dict[str, dict] = {
            "GS-NODE-001": {
                "nodeId": "GS-NODE-001",
                "name": "Node Alpha (ESP8266 Prototype)",
                "location": "Sector 4 — Main Junction",
                "feeder": "Feeder Line A",
                "status": "OFFLINE",
                "communicationState": "REMOTE_UNAVAILABLE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
                "faultClassification": None,
                "risk": None,
                "localization": None,
                "explanation": None,
            },
            "GS-NODE-002": {
                "nodeId": "GS-NODE-002",
                "name": "Node Beta (Virtual Feeder Node)",
                "location": "Sector 7 — Industrial Zone",
                "feeder": "Feeder Line B",
                "status": "OFFLINE",
                "communicationState": "REMOTE_UNAVAILABLE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
                "faultClassification": None,
                "risk": None,
                "localization": None,
                "explanation": None,
            },
            "GS-NODE-003": {
                "nodeId": "GS-NODE-003",
                "name": "Node Gamma (Virtual Feeder Node)",
                "location": "Sector 12 — Rural Extension",
                "feeder": "Feeder Line C",
                "status": "OFFLINE",
                "communicationState": "REMOTE_UNAVAILABLE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
                "faultClassification": None,
                "risk": None,
                "localization": None,
                "explanation": None,
            },
            "GS-NODE-004": {
                "nodeId": "GS-NODE-004",
                "name": "Node Delta (Virtual Feeder Node)",
                "location": "Sector 19 — Substation Outflow",
                "feeder": "Feeder Line D",
                "status": "OFFLINE",
                "communicationState": "REMOTE_UNAVAILABLE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
                "faultClassification": None,
                "risk": None,
                "localization": None,
                "explanation": None,
            },
        }

        self._alerts: List[dict] = []
        self._events: List[dict] = [
            {
                "id": str(uuid.uuid4()),
                "nodeId": "SYSTEM",
                "type": "SYSTEM",
                "severity": "INFO",
                "message": "GridSenti backend state service initialized with Batch 2 resilience features",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "simulated": True,
                "details": None,
            }
        ]

    def add_event(self, event_dict: dict):
        with self._lock:
            if "simulated" not in event_dict:
                event_dict["simulated"] = True
            self._events.insert(0, event_dict)

    # ── Node & Telemetry Update ───────────────────────────────────────────────

    def update_telemetry(
        self,
        telemetry: TelemetryRequest,
        detection: DetectionResultSchema,
    ) -> Dict:
        with self._lock:
            now_utc = datetime.now(timezone.utc)
            now_iso = now_utc.isoformat()
            now_epoch = now_utc.timestamp()

            node_id = telemetry.nodeId

            # 1. Multi-class Fault Classification
            multiclass_res = predict_multiclass_fault(telemetry.ea, telemetry.eb, telemetry.ec)
            fault_class_schema = FaultClassificationSchema(**multiclass_res)

            # 2. Risk Calculation
            is_fault = (
                detection.classification == "HIF"
                or detection.rule_classification == "POSSIBLE_HIF"
                or multiclass_res["faultType"] not in ["Normal", "CS", "LS"]
            )
            ml_hif_prob = detection.model_probability.get("HIF", 0.0)

            risk_res = risk_service.calculate_risk(
                node_id=node_id,
                ml_hif_prob=ml_hif_prob,
                rule_score=detection.rule_score,
                is_fault=is_fault,
            )
            risk_schema = RiskSchema(**risk_res)

            # 3. Localization
            node_info = self._nodes.get(node_id, {})
            loc_res = localization_service.localize_fault(
                reporting_node_id=node_id,
                is_fault=is_fault,
                node_location=node_info.get("location"),
                node_feeder=node_info.get("feeder"),
            )
            loc_schema = LocalizationSchema(**loc_res)

            # 4. Explanation Generation
            exp_res = explanation_service.generate_explanation(
                node_id=node_id,
                binary_classification=detection.classification,
                ml_hif_prob=ml_hif_prob,
                fault_type=multiclass_res["faultType"],
                rule_score=detection.rule_score,
                rule_reasons=detection.reasons,
                risk_level=risk_res["level"],
                risk_score=risk_res["score"],
                persistence_count=risk_res["persistenceCount"],
                recommended_action=risk_res["recommendedAction"],
            )
            exp_schema = ExplanationSchema(**exp_res)

            # 5. Isolation Recommendation Check
            if risk_res["level"] == "CRITICAL":
                isolation_service.recommend_isolation(node_id)
            else:
                # Auto-clear ISOLATION_RECOMMENDED when no longer critical
                # Does NOT touch explicit ISOLATED state
                isolation_service.clear_recommendation(node_id)

            iso_res = isolation_service.get_isolation_status(node_id)
            iso_schema = IsolationStatusSchema(**iso_res)

            # 6. Public Warning Query
            active_warnings = [
                w for w in public_warning_service.get_active_warnings()
                if w["nodeId"] == node_id
            ]
            warning_schema = PublicWarningSchema(**active_warnings[0]) if active_warnings else None

            # Register on the fly if new node
            if node_id not in self._nodes:
                self._nodes[node_id] = {
                    "nodeId": node_id,
                    "name": f"Node {node_id} (Dynamic Node)",
                    "location": "Unmapped Sector",
                    "feeder": "Auxiliary Feeder",
                    "status": "ONLINE",
                    "communicationState": "REMOTE_CONNECTED",
                    "lastHeartbeat": now_iso,
                    "lastHeartbeat_epoch": now_epoch,
                    "lastDetection": detection.classification,
                    "latestTelemetry": None,
                    "latestDetectionResult": None,
                    "faultClassification": None,
                    "risk": None,
                    "localization": None,
                    "explanation": None,
                }

            node = self._nodes[node_id]
            node["lastHeartbeat"] = now_iso
            node["lastHeartbeat_epoch"] = now_epoch
            node["latestTelemetry"] = telemetry.model_dump()
            node["latestDetectionResult"] = detection.model_dump()
            node["lastDetection"] = detection.classification
            node["faultClassification"] = fault_class_schema.model_dump()
            node["risk"] = risk_schema.model_dump()
            node["localization"] = loc_schema.model_dump()
            node["explanation"] = exp_schema.model_dump()
            node["communicationState"] = "REMOTE_CONNECTED"

            # Node Status determination
            if risk_res["level"] == "CRITICAL" or detection.classification == "HIF":
                node["status"] = "WARNING"
            elif risk_res["level"] == "MEDIUM" or detection.rule_classification == "POSSIBLE_HIF":
                node["status"] = "WARNING"
            else:
                node["status"] = "ONLINE"

            # ── ALERT MANAGEMENT ─────────────────────────────────────────────
            active_alert_idx = next(
                (i for i, a in enumerate(self._alerts) if a["nodeId"] == node_id and not a.get("acknowledged", False)),
                None,
            )

            if risk_res["level"] in ["CRITICAL", "MEDIUM"]:
                severity = "CRITICAL" if risk_res["level"] == "CRITICAL" else "WARNING"
                alert_msg = (
                    f"Possible {multiclass_res['faultType']} detected near {node_id}. "
                    f"Risk: {risk_res['level']} ({risk_res['score']:.1f}/100), "
                    f"ML Prob: {ml_hif_prob:.2f}, Persistence: {risk_res['persistenceCount']}"
                )

                if active_alert_idx is not None:
                    alert_entry = self._alerts[active_alert_idx]
                    alert_entry["severity"] = severity
                    alert_entry["message"] = alert_msg
                    alert_entry["timestamp"] = now_iso
                    alert_entry["faultType"] = multiclass_res["faultType"]
                    alert_entry["riskLevel"] = risk_res["level"]
                    alert_entry["riskScore"] = risk_res["score"]
                    alert_entry["recommendedAction"] = risk_res["recommendedAction"]
                    alert_entry["isolationStatus"] = iso_res["status"]
                    alert_entry["publicWarningId"] = warning_schema.warningId if warning_schema else None
                else:
                    alert_id = str(uuid.uuid4())
                    alert_entry = {
                        "id": alert_id,
                        "severity": severity,
                        "type": "POSSIBLE_HIF",
                        "nodeId": node_id,
                        "message": alert_msg,
                        "timestamp": now_iso,
                        "acknowledged": False,
                        "faultType": multiclass_res["faultType"],
                        "riskLevel": risk_res["level"],
                        "riskScore": risk_res["score"],
                        "recommendedAction": risk_res["recommendedAction"],
                        "isolationStatus": iso_res["status"],
                        "publicWarningId": warning_schema.warningId if warning_schema else None,
                    }
                    self._alerts.insert(0, alert_entry)

                    self._events.insert(0, {
                        "id": str(uuid.uuid4()),
                        "nodeId": node_id,
                        "type": "HIF_DETECTED" if severity == "CRITICAL" else "FAULT_DETECTED",
                        "severity": severity,
                        "message": alert_msg,
                        "timestamp": now_iso,
                        "simulated": True,
                        "details": {
                            "faultType": multiclass_res["faultType"],
                            "riskLevel": risk_res["level"],
                            "riskScore": risk_res["score"],
                            "persistenceCount": risk_res["persistenceCount"],
                        },
                    })
            else:
                if active_alert_idx is not None:
                    removed_alert = self._alerts.pop(active_alert_idx)
                    self._events.insert(0, {
                        "id": str(uuid.uuid4()),
                        "nodeId": node_id,
                        "type": "FAULT_RESOLVED",
                        "severity": "INFO",
                        "message": f"Grid condition at {node_id} returned to normal state (Risk: LOW, Score: 0.0)",
                        "timestamp": now_iso,
                        "simulated": True,
                        "details": {"resolved_alert_id": removed_alert["id"]},
                    })

            return {
                "nodeId": node_id,
                "timestamp": telemetry.timestamp,
                "simulated": telemetry.simulated,
                "detection": detection,
                "faultClassification": fault_class_schema,
                "risk": risk_schema,
                "localization": loc_schema,
                "explanation": exp_schema,
                "communicationState": node["communicationState"],
                "isolationState": iso_schema,
                "activeWarning": warning_schema,
                "status": node["status"],
            }

    # ── Node Queries & Heartbeat Verification ─────────────────────────────────

    def get_all_nodes(self, timeout_seconds: float = HEARTBEAT_TIMEOUT_SECONDS) -> List[NodeStatusSchema]:
        with self._lock:
            self._apply_heartbeat_timeouts(timeout_seconds)
            return [NodeStatusSchema(**self._format_node(n)) for n in self._nodes.values()]

    def get_node(self, node_id: str, timeout_seconds: float = HEARTBEAT_TIMEOUT_SECONDS) -> Optional[NodeStatusSchema]:
        with self._lock:
            self._apply_heartbeat_timeouts(timeout_seconds)
            node = self._nodes.get(node_id)
            if not node:
                return None
            return NodeStatusSchema(**self._format_node(node))

    def get_latest_detection(self) -> Optional[dict]:
        with self._lock:
            latest = None
            latest_time = 0.0
            for node in self._nodes.values():
                if node["latestDetectionResult"] and node["lastHeartbeat_epoch"] > latest_time:
                    latest_time = node["lastHeartbeat_epoch"]
                    node_id = node["nodeId"]
                    iso_res = isolation_service.get_isolation_status(node_id)
                    active_warnings = [
                        w for w in public_warning_service.get_active_warnings()
                        if w["nodeId"] == node_id
                    ]

                    latest = {
                        "nodeId": node_id,
                        "timestamp": node["lastHeartbeat"],
                        "simulated": node["latestTelemetry"].get("simulated", True) if node["latestTelemetry"] else True,
                        "detection": node["latestDetectionResult"],
                        "faultClassification": node.get("faultClassification"),
                        "risk": node.get("risk"),
                        "localization": node.get("localization"),
                        "explanation": node.get("explanation"),
                        "communicationState": node.get("communicationState", "REMOTE_CONNECTED"),
                        "isolationState": iso_res,
                        "activeWarning": active_warnings[0] if active_warnings else None,
                        "nodeStatus": node["status"],
                    }
            return latest

    def get_alerts(self) -> List[AlertSchema]:
        with self._lock:
            sorted_alerts = sorted(
                self._alerts,
                key=lambda a: a.get("timestamp", ""),
                reverse=True,
            )
            return [AlertSchema(**a) for a in sorted_alerts]

    def get_events(self, limit: int = 50) -> List[EventSchema]:
        with self._lock:
            return [EventSchema(**e) for e in self._events[:limit]]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _apply_heartbeat_timeouts(self, timeout_seconds: float):
        now_epoch = datetime.now(timezone.utc).timestamp()
        for node_id, node in self._nodes.items():
            if node["lastHeartbeat_epoch"] > 0:
                elapsed = now_epoch - node["lastHeartbeat_epoch"]
                if elapsed > timeout_seconds and node["status"] != "OFFLINE":
                    node["status"] = "OFFLINE"
                    node["communicationState"] = "REMOTE_UNAVAILABLE"
                    risk_service.update_persistence(node_id, is_fault=False)
                    self._events.insert(0, {
                        "id": str(uuid.uuid4()),
                        "nodeId": node_id,
                        "type": "HEARTBEAT_TIMEOUT",
                        "severity": "WARNING",
                        "message": f"Heartbeat timeout on {node_id} ({elapsed:.1f}s since last packet) — Node OFFLINE",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "simulated": True,
                        "details": {"elapsed_seconds": round(elapsed, 1)},
                    })

    def _format_node(self, node: dict) -> dict:
        node_id = node["nodeId"]
        iso_res = isolation_service.get_isolation_status(node_id)
        active_warnings = [
            w for w in public_warning_service.get_active_warnings()
            if w["nodeId"] == node_id
        ]

        return {
            "nodeId": node_id,
            "name": node["name"],
            "location": node["location"],
            "feeder": node["feeder"],
            "status": node["status"],
            "communicationState": node.get("communicationState", "REMOTE_UNAVAILABLE" if node["status"] == "OFFLINE" else "REMOTE_CONNECTED"),
            "lastHeartbeat": node["lastHeartbeat"],
            "lastDetection": node["lastDetection"],
            "latestTelemetry": node["latestTelemetry"],
            "latestDetectionResult": node["latestDetectionResult"],
            "faultClassification": node.get("faultClassification"),
            "risk": node.get("risk"),
            "localization": node.get("localization"),
            "explanation": node.get("explanation"),
            "isolationState": iso_res,
            "activeWarning": active_warnings[0] if active_warnings else None,
        }


# Singleton instance
state_service = StateService()
