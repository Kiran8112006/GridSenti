"""
GridSenti — API Routes
======================
FastAPI endpoints for live edge telemetry ingestion, node status monitoring,
HIF detection, multi-class predictions, risk scores, localization,
explanations, safe isolation simulation, public hazard warning simulation,
alerts, and system event timeline.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.telemetry import (
    TelemetryRequest,
    TelemetryResponse,
    DetectionResultSchema,
    NodeStatusSchema,
    IsolationStatusSchema,
    PublicWarningSchema,
    AlertSchema,
    EventSchema,
)
from app.detection.hif_detector import detect_hif, get_model_status
from app.services.state_service import state_service, HEARTBEAT_TIMEOUT_SECONDS
from app.services.isolation_service import isolation_service
from app.services.public_warning_service import public_warning_service

router = APIRouter()


class NodeActionRequest(BaseModel):
    nodeId: str = Field(..., description="Target node identifier", example="GS-NODE-001")


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
    multi-class classifier, risk engine, localization, explanation, isolation check,
    update in-memory node heartbeats and alerts, and return combined detection output.
    """
    raw_detection = detect_hif(ea=payload.ea, eb=payload.eb, ec=payload.ec)

    if not raw_detection.get("model_loaded", False) and raw_detection.get("error"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"HIF Detection Engine error: {raw_detection['error']}",
        )

    rule_res = raw_detection.get("rule_engine") or {}
    detection_schema = DetectionResultSchema(
        classification=raw_detection.get("classification") or "NON_HIF",
        model_probability=raw_detection.get("model_probability") or {"HIF": 0.0, "NON_HIF": 1.0},
        rule_score=rule_res.get("score", 0.0),
        rule_classification=rule_res.get("classification", "NORMAL"),
        reasons=rule_res.get("reasons", []),
    )

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
        communicationState=res_dict["communicationState"],
        isolationState=res_dict["isolationState"],
        activeWarning=res_dict["activeWarning"],
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


# ── 3. Isolation Simulation ──────────────────────────────────────────────────

@router.get(
    "/isolation",
    summary="Get current simulated feeder isolation statuses across nodes",
)
def get_isolation_statuses():
    """Return simulated feeder isolation states."""
    return isolation_service.get_all_isolation_statuses()


@router.post(
    "/isolation/simulate",
    response_model=IsolationStatusSchema,
    summary="Simulate feeder line section isolation (SOFTWARE SIMULATION ONLY)",
)
def simulate_isolation(req: NodeActionRequest):
    """Mark specified node's adjacent feeder section as ISOLATED (Software simulation only)."""
    node = state_service.get_node(req.nodeId)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node '{req.nodeId}' not found",
        )
    res = isolation_service.simulate_isolation(req.nodeId, state_service_ref=state_service)
    return IsolationStatusSchema(**res)


@router.post(
    "/isolation/reset",
    response_model=IsolationStatusSchema,
    summary="Reset simulated feeder line section isolation to NOT_ISOLATED",
)
def reset_isolation(req: NodeActionRequest):
    """Reset specified node's feeder section isolation status to NOT_ISOLATED."""
    res = isolation_service.reset_isolation(req.nodeId, state_service_ref=state_service)
    return IsolationStatusSchema(**res)


# ── 4. Public Warning Simulation ──────────────────────────────────────────────

@router.get(
    "/public-warnings",
    response_model=List[PublicWarningSchema],
    summary="Get active public hazard warnings",
)
def get_public_warnings():
    """Return list of active simulated public safety warnings."""
    return [PublicWarningSchema(**w) for w in public_warning_service.get_active_warnings()]


@router.post(
    "/public-warnings/simulate",
    response_model=PublicWarningSchema,
    summary="Simulate public hazard warning broadcast for a node",
)
def simulate_public_warning(req: NodeActionRequest):
    """Generate a prototype public safety warning notification for specified node."""
    node = state_service.get_node(req.nodeId)
    location = node.location if node else f"Near {req.nodeId}"
    warning_data = public_warning_service.simulate_warning(
        node_id=req.nodeId,
        location=location,
        state_service_ref=state_service,
    )
    return PublicWarningSchema(**warning_data)


@router.post(
    "/public-warnings/{warningId}/resolve",
    response_model=PublicWarningSchema,
    summary="Resolve an active simulated public hazard warning",
)
def resolve_public_warning(warningId: str = Path(...)):
    """Mark specified public warning as RESOLVED."""
    res = public_warning_service.resolve_warning(warning_id=warningId, state_service_ref=state_service)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Public Warning '{warningId}' not found",
        )
    return PublicWarningSchema(**res)


# ── 5. Detection Results ─────────────────────────────────────────────────────

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
        "communicationState": node.communicationState,
        "lastHeartbeat": node.lastHeartbeat,
        "latestTelemetry": node.latestTelemetry,
        "latestDetectionResult": node.latestDetectionResult,
        "faultClassification": node.faultClassification,
        "risk": node.risk,
        "localization": node.localization,
        "explanation": node.explanation,
        "isolationState": node.isolationState,
        "activeWarning": node.activeWarning,
    }


# ── 6. Alerts & Events ───────────────────────────────────────────────────────

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


# ── 7. Health Check ──────────────────────────────────────────────────────────

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
