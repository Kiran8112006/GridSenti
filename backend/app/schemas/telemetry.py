"""
GridSenti — Telemetry & Node Schemas
====================================
Pydantic schemas for API requests, telemetry payloads, node statuses,
alerts, and system events.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TelemetryRequest(BaseModel):
    nodeId: str = Field(..., example="GS-NODE-001", description="Unique node identifier")
    timestamp: str = Field(..., example="2026-08-22T01:00:00Z", description="ISO timestamp")
    ea: float = Field(..., description="DWT Energy Feature Phase A")
    eb: float = Field(..., description="DWT Energy Feature Phase B")
    ec: float = Field(..., description="DWT Energy Feature Phase C")
    simulated: bool = Field(True, description="Flag indicating simulated data")
    simulationMode: str = Field("NORMAL", description="NORMAL, HIF, or AUTO")


class DetectionResultSchema(BaseModel):
    classification: str = Field(..., example="NON_HIF", description="ML Model classification result")
    model_probability: Dict[str, float] = Field(..., description="Random Forest voting probabilities per class")
    rule_score: float = Field(..., example=0.0, description="Prototype Rule Engine score (0-100)")
    rule_classification: str = Field(..., example="NORMAL", description="Rule engine classification")
    reasons: List[str] = Field(default_factory=list, description="Rule engine explanation list")


class TelemetryResponse(BaseModel):
    nodeId: str
    timestamp: str
    simulated: bool
    detection: DetectionResultSchema
    status: str


class NodeStatusSchema(BaseModel):
    nodeId: str
    name: str
    location: str
    feeder: str
    status: str  # ONLINE, OFFLINE, WARNING
    lastHeartbeat: Optional[str] = None
    lastDetection: Optional[str] = None
    latestTelemetry: Optional[TelemetryRequest] = None
    latestDetectionResult: Optional[DetectionResultSchema] = None


class AlertSchema(BaseModel):
    id: str
    severity: str  # CRITICAL, WARNING, INFO
    type: str
    nodeId: str
    message: str
    timestamp: str
    acknowledged: bool = False


class EventSchema(BaseModel):
    id: str
    nodeId: str
    type: str  # HIF_DETECTED, HEARTBEAT_TIMEOUT, SYSTEM
    severity: str  # CRITICAL, WARNING, INFO
    message: str
    timestamp: str
    details: Optional[Dict] = None
