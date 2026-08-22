"""
GridSenti — Batch 2 Features Test Suite
========================================
Tests for Communication Resilience, Software Isolation Simulation, Public Hazard
Warning Simulation, Safety Events, and API endpoints.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.isolation_service import isolation_service
from app.services.public_warning_service import public_warning_service
from app.services.state_service import state_service

client = TestClient(app)


def test_communication_state_representation():
    """Verify REMOTE_CONNECTED on telemetry ingest and REMOTE_UNAVAILABLE on heartbeat timeout."""
    test_node = "TEST-COMM-NODE"

    # Telemetry Ingest -> REMOTE_CONNECTED
    telemetry_payload = {
        "nodeId": test_node,
        "timestamp": "2026-08-22T03:40:00Z",
        "ea": 4.23e10,
        "eb": 4.84e9,
        "ec": 1.52e10,
        "simulated": True,
        "simulationMode": "NORMAL",
    }
    res = client.post("/api/telemetry", json=telemetry_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["communicationState"] == "REMOTE_CONNECTED"
    assert data["status"] == "ONLINE"

    # Query node via /api/nodes?timeout=0.001 -> Expect status OFFLINE and communicationState REMOTE_UNAVAILABLE
    import time
    time.sleep(0.01)
    nodes_res = client.get("/api/nodes?timeout=0.001")
    assert nodes_res.status_code == 200
    nodes = nodes_res.json()
    comm_node = next((n for n in nodes if n["nodeId"] == test_node), None)
    assert comm_node is not None
    assert comm_node["status"] == "OFFLINE"
    assert comm_node["communicationState"] == "REMOTE_UNAVAILABLE"


def test_isolation_simulation_workflow():
    """Verify NOT_ISOLATED -> ISOLATION_RECOMMENDED -> ISOLATED (Simulated) -> NOT_ISOLATED workflow."""
    test_node = "GS-NODE-001"

    # 1. Reset initial state
    client.post("/api/isolation/reset", json={"nodeId": test_node})
    status_initial = isolation_service.get_isolation_status(test_node)
    assert status_initial["status"] == "NOT_ISOLATED"

    # 2. Ingest HIF Telemetry -> Risk CRITICAL -> ISOLATION_RECOMMENDED
    hif_payload = {
        "nodeId": test_node,
        "timestamp": "2026-08-22T03:40:10Z",
        "ea": 5.57e10,
        "eb": 4.88e9,
        "ec": 1.51e10,
        "simulated": True,
        "simulationMode": "HIF",
    }
    client.post("/api/telemetry", json=hif_payload)
    status_rec = isolation_service.get_isolation_status(test_node)
    assert status_rec["status"] in ["ISOLATION_RECOMMENDED", "ISOLATED"]

    # 3. Simulate Isolation API
    sim_res = client.post("/api/isolation/simulate", json={"nodeId": test_node})
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["status"] == "ISOLATED"
    assert sim_data["simulated"] is True
    assert "marked ISOLATED" in sim_data["message"]

    # 4. Reset Isolation API
    reset_res = client.post("/api/isolation/reset", json={"nodeId": test_node})
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "NOT_ISOLATED"


def test_public_warning_simulation_workflow():
    """Verify warning creation, active retrieval, and resolution workflow."""
    test_node = "GS-NODE-001"

    # 1. Simulate Warning
    sim_res = client.post("/api/public-warnings/simulate", json={"nodeId": test_node})
    assert sim_res.status_code == 200
    warning = sim_res.json()

    assert warning["warningId"].startswith("PWR-")
    assert warning["nodeId"] == test_node
    assert warning["severity"] == "CRITICAL"
    assert warning["title"] == "Possible Live Electrical Hazard"
    assert "downed-conductor" in warning["message"]
    assert warning["status"] == "ACTIVE"
    assert warning["simulated"] is True

    warning_id = warning["warningId"]

    # 2. Get Active Warnings
    active_res = client.get("/api/public-warnings")
    assert active_res.status_code == 200
    active_list = active_res.json()
    assert any(w["warningId"] == warning_id for w in active_list)

    # 3. Resolve Warning
    resolve_res = client.post(f"/api/public-warnings/{warning_id}/resolve")
    assert resolve_res.status_code == 200
    resolved_data = resolve_res.json()
    assert resolved_data["status"] == "RESOLVED"
    assert "resolvedAt" in resolved_data

    # 4. Active Warnings list should no longer contain resolved warning
    active_after = client.get("/api/public-warnings").json()
    assert not any(w["warningId"] == warning_id for w in active_after)


def test_safety_events_logging():
    """Verify safety events are correctly appended to the event timeline."""
    events_res = client.get("/api/events?limit=20")
    assert events_res.status_code == 200
    events = events_res.json()
    event_types = [e["type"] for e in events]

    assert any(t in event_types for t in [
        "ISOLATION_SIMULATED",
        "ISOLATION_RESET",
        "PUBLIC_WARNING_SIMULATED",
        "PUBLIC_WARNING_RESOLVED",
        "SYSTEM",
        "HIF_DETECTED",
    ])
