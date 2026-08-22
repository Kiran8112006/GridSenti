"""
GridSenti — Safe Software-Only Isolation Service
=================================================
Manages software-only simulated line isolation states for grid nodes.
Supports states: NOT_ISOLATED, ISOLATION_RECOMMENDED, ISOLATED.

SAFETY NOTICE: This service performs SOFTWARE SIMULATION ONLY.
It does NOT control real electricity or physical relay hardware.
"""

from __future__ import annotations

import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, Optional


class IsolationService:
    def __init__(self):
        self._lock = threading.RLock()  # Use RLock for reentrant safety
        # Per-node isolation state mapping
        # State values: "NOT_ISOLATED", "ISOLATION_RECOMMENDED", "ISOLATED"
        self._states: Dict[str, dict] = {}

    def _get_or_create_status(self, node_id: str) -> dict:
        """Internal helper: get or initialize isolation status. Caller must hold lock."""
        if node_id not in self._states:
            self._states[node_id] = {
                "nodeId": node_id,
                "status": "NOT_ISOLATED",
                "simulated": True,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": "Feeder section operating normally. Not isolated.",
            }
        return self._states[node_id]

    def get_isolation_status(self, node_id: str) -> dict:
        with self._lock:
            return self._get_or_create_status(node_id).copy()

    def recommend_isolation(self, node_id: str) -> dict:
        with self._lock:
            current = self._get_or_create_status(node_id)
            if current["status"] != "ISOLATED":
                current["status"] = "ISOLATION_RECOMMENDED"
                current["timestamp"] = datetime.now(timezone.utc).isoformat()
                current["message"] = (
                    f"CRITICAL fault risk detected on {node_id}. "
                    "Software simulation recommends feeder isolation."
                )
                self._states[node_id] = current
            return current.copy()

    def clear_recommendation(self, node_id: str) -> dict:
        """Auto-clear ISOLATION_RECOMMENDED when risk drops below CRITICAL.
        Does NOT reset an explicit ISOLATED state — that requires manual reset."""
        with self._lock:
            current = self._get_or_create_status(node_id)
            if current["status"] == "ISOLATION_RECOMMENDED":
                current["status"] = "NOT_ISOLATED"
                current["timestamp"] = datetime.now(timezone.utc).isoformat()
                current["message"] = (
                    f"Risk level for {node_id} returned to normal. "
                    "Isolation recommendation automatically cleared."
                )
                self._states[node_id] = current
            return current.copy()

    def simulate_isolation(self, node_id: str, state_service_ref=None) -> dict:
        with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            isolation_data = {
                "nodeId": node_id,
                "status": "ISOLATED",
                "simulated": True,
                "timestamp": now_iso,
                "message": f"Simulation: Feeder section adjacent to {node_id} marked ISOLATED.",
            }
            self._states[node_id] = isolation_data
            result = isolation_data.copy()

        # Add event OUTSIDE the lock to prevent cross-lock deadlock
        if state_service_ref:
            state_service_ref.add_event({
                "id": str(uuid.uuid4()),
                "nodeId": node_id,
                "type": "ISOLATION_SIMULATED",
                "severity": "CRITICAL",
                "message": f"Software Simulation: Feeder section at {node_id} manually isolated by operator.",
                "timestamp": now_iso,
                "details": {"simulated": True, "action": "SIMULATE_ISOLATION"},
            })

        return result

    def reset_isolation(self, node_id: str, state_service_ref=None) -> dict:
        with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            isolation_data = {
                "nodeId": node_id,
                "status": "NOT_ISOLATED",
                "simulated": True,
                "timestamp": now_iso,
                "message": f"Simulation: Feeder section adjacent to {node_id} reset to NOT_ISOLATED.",
            }
            self._states[node_id] = isolation_data
            result = isolation_data.copy()

        # Add event OUTSIDE the lock to prevent cross-lock deadlock
        if state_service_ref:
            state_service_ref.add_event({
                "id": str(uuid.uuid4()),
                "nodeId": node_id,
                "type": "ISOLATION_RESET",
                "severity": "INFO",
                "message": f"Software Simulation: Feeder isolation reset to NOT_ISOLATED for {node_id}.",
                "timestamp": now_iso,
                "details": {"simulated": True, "action": "RESET_ISOLATION"},
            })

        return result

    def get_all_isolation_statuses(self) -> Dict[str, dict]:
        with self._lock:
            return {node_id: status.copy() for node_id, status in self._states.items()}


# Singleton instance
isolation_service = IsolationService()
