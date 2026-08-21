"""
GridSenti — In-Memory State & Heartbeat Manager
===============================================
Thread-safe in-memory store for node statuses, heartbeats, alerts,
latest telemetry, and system events for the MVP prototype.
"""

from __future__ import annotations

import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.schemas.telemetry import (
    TelemetryRequest,
    DetectionResultSchema,
    NodeStatusSchema,
    AlertSchema,
    EventSchema,
)

# Heartbeat timeout in seconds (configurable, default 10s)
HEARTBEAT_TIMEOUT_SECONDS = 10.0


class StateService:
    def __init__(self):
        self._lock = threading.Lock()

        # Seed initial registered nodes
        self._nodes: Dict[str, dict] = {
            "GS-NODE-001": {
                "nodeId": "GS-NODE-001",
                "name": "Node Alpha (ESP8266 Prototype)",
                "location": "Sector 4 — Main Junction",
                "feeder": "Feeder Line A",
                "status": "OFFLINE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
            },
            "GS-NODE-002": {
                "nodeId": "GS-NODE-002",
                "name": "Node Beta (Virtual Feeder Node)",
                "location": "Sector 7 — Industrial Zone",
                "feeder": "Feeder Line B",
                "status": "OFFLINE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
            },
            "GS-NODE-003": {
                "nodeId": "GS-NODE-003",
                "name": "Node Gamma (Virtual Feeder Node)",
                "location": "Sector 12 — Rural Extension",
                "feeder": "Feeder Line C",
                "status": "OFFLINE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
            },
            "GS-NODE-004": {
                "nodeId": "GS-NODE-004",
                "name": "Node Delta (Virtual Feeder Node)",
                "location": "Sector 19 — Substation Outflow",
                "feeder": "Feeder Line D",
                "status": "OFFLINE",
                "lastHeartbeat": None,
                "lastHeartbeat_epoch": 0.0,
                "lastDetection": "NORMAL",
                "latestTelemetry": None,
                "latestDetectionResult": None,
            },
        }

        self._alerts: List[dict] = []
        self._events: List[dict] = [
            {
                "id": str(uuid.uuid4()),
                "nodeId": "SYSTEM",
                "type": "SYSTEM",
                "severity": "INFO",
                "message": "GridSenti backend state service initialized",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": None,
            }
        ]

    # ── Node & Telemetry Update ───────────────────────────────────────────────

    def update_telemetry(
        self,
        telemetry: TelemetryRequest,
        detection: DetectionResultSchema,
    ) -> NodeStatusSchema:
        with self._lock:
            now_utc = datetime.now(timezone.utc)
            now_iso = now_utc.isoformat()
            now_epoch = now_utc.timestamp()

            node_id = telemetry.nodeId

            # Register on the fly if new node
            if node_id not in self._nodes:
                self._nodes[node_id] = {
                    "nodeId": node_id,
                    "name": f"Node {node_id} (Dynamic Node)",
                    "location": "Unmapped Sector",
                    "feeder": "Auxiliary Feeder",
                    "status": "ONLINE",
                    "lastHeartbeat": now_iso,
                    "lastHeartbeat_epoch": now_epoch,
                    "lastDetection": detection.classification,
                    "latestTelemetry": None,
                    "latestDetectionResult": None,
                }

            node = self._nodes[node_id]
            node["lastHeartbeat"] = now_iso
            node["lastHeartbeat_epoch"] = now_epoch
            node["latestTelemetry"] = telemetry.model_dump()
            node["latestDetectionResult"] = detection.model_dump()
            node["lastDetection"] = detection.classification

            # Refined Decision Policy:
            # Generate CRITICAL HIF alert only if ML predicts HIF with high probability,
            # or if ML shows elevated suspicion (>= 0.40) AND rule engine corroborates POSSIBLE_HIF.
            # Avoid triggering false CRITICAL grid alerts solely from rule false positives.
            ml_prob_hif = detection.model_probability.get("HIF", 0.0)
            is_ml_hif   = (detection.classification == "HIF" and ml_prob_hif >= 0.50)
            is_corroborated_hif = (ml_prob_hif >= 0.40 and detection.rule_classification == "POSSIBLE_HIF")

            is_critical_hif = is_ml_hif or is_corroborated_hif

            # Status determination
            if is_critical_hif:
                node["status"] = "WARNING"
            elif detection.rule_classification == "POSSIBLE_HIF" or ml_prob_hif >= 0.20:
                node["status"] = "WARNING"
            else:
                node["status"] = "ONLINE"

            # Generate CRITICAL alert if criteria met
            if is_critical_hif:
                alert_id = str(uuid.uuid4())
                alert_msg = (
                    f"Possible High-Impedance Fault detected near {node_id}. "
                    f"ML Probability: {ml_prob_hif:.2f}, "
                    f"Rule Score: {detection.rule_score:.1f}"
                )

                # Avoid duplicate unacknowledged alerts for same node in short time
                existing_recent_alert = any(
                    a["nodeId"] == node_id and not a["acknowledged"]
                    for a in self._alerts
                )

                if not existing_recent_alert:
                    alert_entry = {
                        "id": alert_id,
                        "severity": "CRITICAL",
                        "type": "POSSIBLE_HIF",
                        "nodeId": node_id,
                        "message": alert_msg,
                        "timestamp": now_iso,
                        "acknowledged": False,
                    }
                    self._alerts.insert(0, alert_entry)

                    event_entry = {
                        "id": str(uuid.uuid4()),
                        "nodeId": node_id,
                        "type": "HIF_DETECTED",
                        "severity": "CRITICAL",
                        "message": alert_msg,
                        "timestamp": now_iso,
                        "details": {
                            "reasons": detection.reasons,
                            "rule_score": detection.rule_score,
                            "model_probability": detection.model_probability,
                        },
                    }
                    self._events.insert(0, event_entry)

            return NodeStatusSchema(**self._format_node(node))

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
                    latest = {
                        "nodeId": node["nodeId"],
                        "timestamp": node["lastHeartbeat"],
                        "simulated": node["latestTelemetry"].get("simulated", True) if node["latestTelemetry"] else True,
                        "detection": node["latestDetectionResult"],
                        "nodeStatus": node["status"],
                    }
            return latest

    def get_alerts(self) -> List[AlertSchema]:
        with self._lock:
            return [AlertSchema(**a) for a in self._alerts]

    def get_events(self) -> List[EventSchema]:
        with self._lock:
            return [EventSchema(**e) for e in self._events[:50]]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _apply_heartbeat_timeouts(self, timeout_seconds: float):
        now_epoch = datetime.now(timezone.utc).timestamp()
        for node_id, node in self._nodes.items():
            if node["lastHeartbeat_epoch"] > 0:
                elapsed = now_epoch - node["lastHeartbeat_epoch"]
                if elapsed > timeout_seconds and node["status"] != "OFFLINE":
                    node["status"] = "OFFLINE"
                    # Log heartbeat timeout event
                    self._events.insert(0, {
                        "id": str(uuid.uuid4()),
                        "nodeId": node_id,
                        "type": "HEARTBEAT_TIMEOUT",
                        "severity": "WARNING",
                        "message": f"Heartbeat timeout on {node_id} ({elapsed:.1f}s since last packet)",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "details": {"elapsed_seconds": round(elapsed, 1)},
                    })

    def _format_node(self, node: dict) -> dict:
        return {
            "nodeId": node["nodeId"],
            "name": node["name"],
            "location": node["location"],
            "feeder": node["feeder"],
            "status": node["status"],
            "lastHeartbeat": node["lastHeartbeat"],
            "lastDetection": node["lastDetection"],
            "latestTelemetry": node["latestTelemetry"],
            "latestDetectionResult": node["latestDetectionResult"],
        }


# Singleton instance
state_service = StateService()
