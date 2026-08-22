"""
GridSenti — Public Warning Simulation Service
=============================================
Generates prototype public safety hazard warning notifications for downed-conductor
or severe high-impedance fault events.

SAFETY NOTICE: This service performs PROTOTYPE NOTIFICATION SIMULATION ONLY.
It does NOT connect to real emergency broadcast or public warning systems.
"""

from __future__ import annotations

import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional


class PublicWarningService:
    def __init__(self):
        self._lock = threading.RLock()  # Use RLock for reentrant safety
        # Storage for simulated public warnings
        self._warnings: Dict[str, dict] = {}

    def simulate_warning(self, node_id: str, location: Optional[str] = None, state_service_ref=None) -> dict:
        with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            warning_id = f"PWR-{uuid.uuid4().hex[:8].upper()}"

            # Check if there is already an active warning for this node
            for existing in self._warnings.values():
                if existing["nodeId"] == node_id and existing["status"] == "ACTIVE":
                    existing["timestamp"] = now_iso
                    return existing.copy()

            warning_data = {
                "warningId": warning_id,
                "nodeId": node_id,
                "severity": "CRITICAL",
                "title": "Possible Live Electrical Hazard",
                "message": f"Possible energized downed-conductor hazard detected near {node_id}. Avoid the area. Utility response requested.",
                "location": location or f"Near {node_id} Feeder Line",
                "timestamp": now_iso,
                "simulated": True,
                "status": "ACTIVE",
            }

            self._warnings[warning_id] = warning_data
            result = warning_data.copy()

        # Add event OUTSIDE the lock to prevent cross-lock deadlock
        if state_service_ref:
            state_service_ref.add_event({
                "id": str(uuid.uuid4()),
                "nodeId": node_id,
                "type": "PUBLIC_WARNING_SIMULATED",
                "severity": "CRITICAL",
                "message": f"Public Warning Simulation: Active hazard alert generated for {node_id}.",
                "timestamp": now_iso,
                "details": {"warningId": warning_id, "simulated": True},
            })

        return result

    def resolve_warning(self, warning_id: str, state_service_ref=None) -> Optional[dict]:
        with self._lock:
            warning = self._warnings.get(warning_id)
            if not warning:
                return None

            now_iso = datetime.now(timezone.utc).isoformat()
            warning["status"] = "RESOLVED"
            warning["resolvedAt"] = now_iso
            node_id = warning["nodeId"]
            result = warning.copy()

        # Add event OUTSIDE the lock to prevent cross-lock deadlock
        if state_service_ref:
            state_service_ref.add_event({
                "id": str(uuid.uuid4()),
                "nodeId": node_id,
                "type": "PUBLIC_WARNING_RESOLVED",
                "severity": "INFO",
                "message": f"Public Warning Simulation: Active hazard alert {warning_id} marked RESOLVED.",
                "timestamp": now_iso,
                "details": {"warningId": warning_id, "simulated": True},
            })

        return result

    def get_active_warnings(self) -> List[dict]:
        with self._lock:
            return [
                w.copy()
                for w in self._warnings.values()
                if w["status"] == "ACTIVE"
            ]

    def get_all_warnings(self) -> List[dict]:
        with self._lock:
            return [w.copy() for w in self._warnings.values()]


# Singleton instance
public_warning_service = PublicWarningService()
