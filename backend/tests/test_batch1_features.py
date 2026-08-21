"""
GridSenti — Batch 1 Features Test Suite
========================================
Tests for Risk Engine, Multi-class Fault Classification, Localization Architecture,
Deterministic Explanations, Event History limit/deduplication, and API integration.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.risk_service import risk_service, RiskEngineService
from app.services.localization_service import localization_service
from app.services.explanation_service import explanation_service
from app.services.state_service import state_service
from ml.multiclass_predict import predict_multiclass_fault
from ml.multiclass_train import train_multiclass_model

client = TestClient(app)


def test_multiclass_model_inference():
    """Verify multi-class classifier predicts valid classes across 8 dataset labels."""
    # Test 1 — Normal sample
    res_norm = predict_multiclass_fault(ea=4.23e10, eb=4.84e9, ec=1.52e10)
    assert res_norm["modelLoaded"] is True
    assert res_norm["faultType"] in ["Normal", "CS", "LS", "HIF", "LG", "LLG", "LLLG", "LL"]
    assert "faultTypeProbability" in res_norm
    assert "faultTypeProbabilities" in res_norm

    # Test 2 — HIF sample
    res_hif = predict_multiclass_fault(ea=5.57e10, eb=4.88e9, ec=1.51e10)
    assert res_hif["modelLoaded"] is True
    assert res_hif["faultType"] == "HIF"
    assert res_hif["faultTypeProbability"] >= 0.80


def test_risk_engine_scoring_and_persistence():
    """Verify Risk Engine scoring, component weights, risk levels, and persistence reset."""
    test_node = "TEST-NODE-RISK"

    # Reset persistence
    risk_service.update_persistence(test_node, is_fault=False)

    # 1. Normal packet -> LOW risk (score < 34)
    r1 = risk_service.calculate_risk(test_node, ml_hif_prob=0.0, rule_score=0.0, is_fault=False)
    assert r1["level"] == "LOW"
    assert r1["score"] < 34.0
    assert r1["persistenceCount"] == 0
    assert r1["recommendedAction"] == RiskEngineService.ACTION_CONTINUE_MONITORING

    # 2. Packet 1 Fault -> Persistence = 1
    r2 = risk_service.calculate_risk(test_node, ml_hif_prob=1.0, rule_score=100.0, is_fault=True)
    assert r2["persistenceCount"] == 1
    assert r2["score"] > 60.0

    # 3. Packet 2 Fault -> Persistence = 2
    r3 = risk_service.calculate_risk(test_node, ml_hif_prob=1.0, rule_score=100.0, is_fault=True)
    assert r3["persistenceCount"] == 2

    # 4. Packet 3 Persistent Fault -> Persistence = 3 -> CRITICAL risk (score >= 70)
    r4 = risk_service.calculate_risk(test_node, ml_hif_prob=1.0, rule_score=100.0, is_fault=True)
    assert r4["persistenceCount"] == 3
    assert r4["level"] == "CRITICAL"
    assert r4["score"] >= 70.0
    assert r4["recommendedAction"] == RiskEngineService.ACTION_UTILITY_ISOLATION

    # 5. Normal packet -> Resets persistence to 0
    r5 = risk_service.calculate_risk(test_node, ml_hif_prob=0.0, rule_score=0.0, is_fault=False)
    assert r5["persistenceCount"] == 0
    assert r5["level"] == "LOW"


def test_localization_service():
    """Verify localization returns NODE_LEVEL for physical ESP8266 node."""
    loc_hif = localization_service.localize_fault("GS-NODE-001", is_fault=True)
    assert loc_hif["localizationType"] == "NODE_LEVEL"
    assert loc_hif["nodeId"] == "GS-NODE-001"
    assert "Feeder Line A" in loc_hif["feeder"]
    assert "single physical ESP8266 node" in loc_hif["disclaimer"]

    loc_norm = localization_service.localize_fault("GS-NODE-001", is_fault=False)
    assert loc_norm["localizationType"] == "NOMINAL"


def test_explanation_service():
    """Verify explanation service generates deterministic evidence-driven text."""
    exp = explanation_service.generate_explanation(
        node_id="GS-NODE-001",
        binary_classification="HIF",
        ml_hif_prob=1.0,
        fault_type="HIF",
        rule_score=100.0,
        rule_reasons=["Severe phase imbalance shift"],
        risk_level="CRITICAL",
        risk_score=92.0,
        persistence_count=3,
        recommended_action="UTILITY_ALERT_AND_ISOLATION_RECOMMENDATION",
    )
    assert "summary" in exp
    assert "evidence" in exp
    assert "GS-NODE-001" in exp["summary"]
    assert "CRITICAL" in exp["summary"]
    assert any("Severe phase imbalance shift" in ev for ev in exp["evidence"])


def test_combined_api_telemetry_endpoint():
    """Verify POST /api/telemetry returns all combined Batch 1 fields."""
    hif_payload = {
        "nodeId": "GS-NODE-001",
        "timestamp": "2026-08-22T03:00:00Z",
        "ea": 5.57e10,
        "eb": 4.88e9,
        "ec": 1.51e10,
        "simulated": True,
        "simulationMode": "HIF",
    }
    response = client.post("/api/telemetry", json=hif_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["nodeId"] == "GS-NODE-001"
    assert "detection" in data
    assert "faultClassification" in data
    assert data["faultClassification"]["faultType"] == "HIF"

    assert "risk" in data
    assert data["risk"]["level"] in ["LOW", "MEDIUM", "CRITICAL"]
    assert "score" in data["risk"]
    assert "persistenceCount" in data["risk"]

    assert "localization" in data
    assert data["localization"]["localizationType"] == "NODE_LEVEL"

    assert "explanation" in data
    assert len(data["explanation"]["evidence"]) > 0


def test_events_limit_query():
    """Verify GET /api/events?limit=5 supports limit parameter."""
    resp = client.get("/api/events?limit=5")
    assert resp.status_code == 200
    events = resp.json()
    assert isinstance(events, list)
    assert len(events) <= 5
