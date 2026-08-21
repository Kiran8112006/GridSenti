"""
GridSenti — API Routes
======================
FastAPI endpoints for live edge telemetry ingestion, node status monitoring,
HIF detection results, multi-class predictions, risk scores, localization,
explanations, alerts, and system event timeline.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.telemetry import (
    TelemetryRequest,
    TelemetryResponse,
    DetectionResultSchema,
    NodeStatusSchema,
    AlertSchema,
    EventSchema,
)
from app.detection.hif_detector import detect_hif, get_model_status
from app.services.state_service import state_service, HEARTBEAT_TIMEOUT_SECONDS

router = APIRouter()


# ── 1. Telemetry Ingestion ──────────────────────────────────────────────────

@router.post(
    "/telemetry",
    response_model=TelemetryResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest simulated edge telemetry from ESP8266 or simulator",
)
def ingest_telemetry(payload: TelemetryRequest):
    """
    Ingest three-phase DWT energy telemetry (EA, EB, EC) from an edge node,
    invoke the HIF detection engine (Rule Engine + Binary Random Forest),
    multi-class classifier, risk engine, localization, and explanation service,
    update in-memory node heartbeats and alerts, and return combined detection output.
    """
    # Invoke HIF Detector
    raw_detection = detect_hif(ea=payload.ea, eb=payload.eb, ec=payload.ec)

    if not raw_detection.get("model_loaded", False) and raw_detection.get("error"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"HIF Detection Engine error: {raw_detection['error']}",
        )

    # Format detection result schema
    rule_res = raw_detection.get("rule_engine") or {}
    detection_schema = DetectionResultSchema(
        classification=raw_detection.get("classification") or "NON_HIF",
        model_probability=raw_detection.get("model_probability") or {"HIF": 0.0, "NON_HIF": 1.0},
        rule_score=rule_res.get("score", 0.0),
        rule_classification=rule_res.get("classification", "NORMAL"),
        reasons=rule_res.get("reasons", []),
    )

    # Update state service (runs multi-class, risk, localization, explanation, and updates node state)
    res_dict = state_service.update_telemetry(payload, detection_schema)

    return TelemetryResponse(
        nodeId=res_dict["nodeId"],
        timestamp=res_dict["timestamp"],
        simulated=res_dict["simulated"],
        detection=res_dict["detection"],
        faultClassification=res_dict["faultClassification"],
        risk=res_dict["risk"],
        localization=res_dict["localization"],
        explanation=res_dict["explanation"],
        status=res_dict["status"],
    )


# ── 2. Node Status & Heartbeats ─────────────────────────────────────────────

@router.get(
    "/nodes",
    response_model=List[NodeStatusSchema],
    summary="Get status of all registered edge monitoring nodes",
)
def get_nodes(
    timeout: float = Query(
        HEARTBEAT_TIMEOUT_SECONDS,
        description="Heartbeat timeout in seconds to mark node OFFLINE",
    )
):
    """Return current status, heartbeat, and last detection for all nodes."""
    return state_service.get_all_nodes(timeout_seconds=timeout)


@router.get(
    "/nodes/{nodeId}",
    response_model=NodeStatusSchema,
    summary="Get status of a specific edge node",
)
def get_node_by_id(
    nodeId: str = Path(..., example="GS-NODE-001"),
    timeout: float = Query(HEARTBEAT_TIMEOUT_SECONDS),
):
    """Return status details for a specific node ID."""
    node = state_service.get_node(node_id=nodeId, timeout_seconds=timeout)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node '{nodeId}' not found in registry",
        )
    return node


# ── 3. Detection Results ─────────────────────────────────────────────────────

@router.get(
    "/detection/latest",
    summary="Get latest HIF detection result across the system",
)
def get_latest_detection():
    """Return the most recent detection result from any active node."""
    result = state_service.get_latest_detection()
    if not result:
        return {
            "status": "NO_TELEMETRY",
            "message": "No telemetry received yet. Awaiting ESP8266 node telemetry.",
        }
    return result


@router.get(
    "/detection/node/{nodeId}",
    summary="Get latest detection result for a specific node",
)
def get_latest_detection_for_node(nodeId: str = Path(...)):
    """Return latest detection result for specified node."""
    node = state_service.get_node(nodeId)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node '{nodeId}' not found",
        )
    return {
        "nodeId": node.nodeId,
        "status": node.status,
        "lastHeartbeat": node.lastHeartbeat,
        "latestTelemetry": node.latestTelemetry,
        "latestDetectionResult": node.latestDetectionResult,
        "faultClassification": node.faultClassification,
        "risk": node.risk,
        "localization": node.localization,
        "explanation": node.explanation,
    }


# ── 4. Alerts & Events ───────────────────────────────────────────────────────

@router.get(
    "/alerts",
    response_model=List[AlertSchema],
    summary="Get active system alerts",
)
def get_alerts():
    """Return active HIF and system warnings."""
    return state_service.get_alerts()


@router.get(
    "/events",
    response_model=List[EventSchema],
    summary="Get recent system event timeline",
)
def get_events(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of recent events to return")
):
    """Return chronological list of recent system events."""
    return state_service.get_events(limit=limit)


# ── 5. Health Check ──────────────────────────────────────────────────────────

@router.get(
    "/health",
    summary="System health check endpoint",
)
def health_check():
    """Return overall backend, ML model, and node availability health."""
    model_status = get_model_status()
    all_nodes = state_service.get_all_nodes()
    online_count = sum(1 for n in all_nodes if n.status == "ONLINE")
    warning_count = sum(1 for n in all_nodes if n.status == "WARNING")
    offline_count = sum(1 for n in all_nodes if n.status == "OFFLINE")

    return {
        "status": "ok",
        "service": "gridsenti-backend",
        "ml_model": {
            "ready": model_status.get("ready", False),
            "features_count": model_status.get("n_features", 0),
        },
        "nodes": {
            "total": len(all_nodes),
            "online": online_count,
            "warning": warning_count,
            "offline": offline_count,
        },
    }
