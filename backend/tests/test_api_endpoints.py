"""
GridSenti — API Endpoints Test Suite
====================================
Tests for FastAPI telemetry ingestion, node state, heartbeats, HIF detection,
alerts, and health check. Covers explicit Test 1 (NORMAL) and Test 2 (HIF).
"""

import sys
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.state_service import state_service

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ml_model" in data
    assert data["ml_model"]["ready"] is True
    assert "nodes" in data


def test_telemetry_post_normal():
    """Test 1 — NORMAL sample: EA=4.23e10, EB=4.84e9, EC=1.52e10."""
    payload = {
        "nodeId": "GS-NODE-001",
        "timestamp": "2026-08-22T01:00:00Z",
        "ea": 4.23e10,
        "eb": 4.84e9,
        "ec": 1.52e10,
        "simulated": True,
        "simulationMode": "NORMAL",
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["nodeId"] == "GS-NODE-001"
    assert data["simulated"] is True

    det = data["detection"]
    assert det["classification"] == "NON_HIF"
    assert det["model_probability"]["HIF"] == 0.0
    assert det["rule_classification"] == "NORMAL"
    assert det["rule_score"] == 0.0
    assert data["status"] == "ONLINE"


def test_telemetry_post_hif_triggers_alert_and_warning_status():
    """Test 2 — HIF sample: EA=5.57e10, EB=4.88e9, EC=1.51e10."""
    payload = {
        "nodeId": "GS-NODE-001",
        "timestamp": "2026-08-22T01:00:05Z",
        "ea": 5.57e10,
        "eb": 4.88e9,
        "ec": 1.51e10,
        "simulated": True,
        "simulationMode": "HIF",
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "WARNING"

    det = data["detection"]
    assert det["classification"] == "HIF"
    assert det["model_probability"]["HIF"] == 1.0
    assert det["rule_classification"] == "POSSIBLE_HIF"
    assert det["rule_score"] >= 60.0

    # Verify alerts list contains CRITICAL HIF alert
    alert_resp = client.get("/api/alerts")
    assert alert_resp.status_code == 200
    alerts = alert_resp.json()
    assert len(alerts) > 0
    assert any(a["nodeId"] == "GS-NODE-001" and a["severity"] == "CRITICAL" for a in alerts)

    # Verify events list contains HIF_DETECTED event
    event_resp = client.get("/api/events")
    assert event_resp.status_code == 200
    events = event_resp.json()
    assert len(events) > 0
    assert any(e["type"] == "HIF_DETECTED" for e in events)


def test_invalid_telemetry_rejection():
    invalid_payload = {
        "nodeId": "GS-NODE-001",
        "timestamp": "2026-08-22T01:00:00Z",
        "eb": 4.84e9,
    }
    response = client.post("/api/telemetry", json=invalid_payload)
    assert response.status_code == 422


def test_get_nodes_and_single_node():
    response = client.get("/api/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert isinstance(nodes, list)
    assert len(nodes) >= 4

    single_resp = client.get("/api/nodes/GS-NODE-001")
    assert single_resp.status_code == 200
    node = single_resp.json()
    assert node["nodeId"] == "GS-NODE-001"

    notFound_resp = client.get("/api/nodes/UNKNOWN-NODE-999")
    assert notFound_resp.status_code == 404


def test_latest_detection_endpoints():
    response = client.get("/api/detection/latest")
    assert response.status_code == 200
    data = response.json()
    assert "nodeId" in data
    assert "detection" in data

    node_det = client.get("/api/detection/node/GS-NODE-001")
    assert node_det.status_code == 200
    n_data = node_det.json()
    assert n_data["nodeId"] == "GS-NODE-001"


def test_node_heartbeat_timeout():
    response = client.get("/api/nodes?timeout=0.01")
    assert response.status_code == 200
    nodes = response.json()
    target = next((n for n in nodes if n["nodeId"] == "GS-NODE-002"), None)
    assert target is not None
    assert target["status"] == "OFFLINE"
