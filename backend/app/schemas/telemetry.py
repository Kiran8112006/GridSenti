"""
GridSenti — Telemetry & Node Schemas
====================================
Pydantic schemas for API requests, telemetry payloads, node statuses,
alerts, risk analysis, localization, and system events.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TelemetryRequest(BaseModel):
    nodeId: str = Field(..., description="Unique node identifier")
    timestamp: str = Field(..., description="ISO timestamp")
    ea: float = Field(..., description="DWT Energy Feature Phase A")
    eb: float = Field(..., description="DWT Energy Feature Phase B")
    ec: float = Field(..., description="DWT Energy Feature Phase C")
    simulated: bool = Field(True, description="Flag indicating simulated data")
    simulationMode: str = Field("NORMAL", description="NORMAL, HIF, or AUTO")


class DetectionResultSchema(BaseModel):
    classification: str = Field(..., description="Binary ML Model classification result (HIF/NON_HIF)")
    model_probability: Dict[str, float] = Field(..., description="Binary Random Forest voting probabilities")
    rule_score: float = Field(..., description="Prototype Rule Engine score (0-100)")
    rule_classification: str = Field(..., description="Rule engine classification")
    reasons: List[str] = Field(default_factory=list, description="Rule engine explanation list")


class FaultClassificationSchema(BaseModel):
    faultType: str = Field(..., description="Predicted multi-class fault label (Normal, LG, LLG, LLLG, LL, HIF, CS, LS)")
    faultTypeProbability: float = Field(..., description="Probability score for predicted fault type")
    faultTypeProbabilities: Dict[str, float] = Field(default_factory=dict, description="Per-class probabilities across 8 dataset classes")


class RiskSchema(BaseModel):
    level: str = Field(..., description="Risk Level: LOW, MEDIUM, CRITICAL")
    score: float = Field(..., description="Composite Risk Score (0-100)")
    components: Dict[str, float] = Field(..., description="mlEvidence, ruleEvidence, persistenceEvidence breakdown")
    persistenceCount: int = Field(..., description="Consecutive fault packet observations for node")
    reasons: List[str] = Field(default_factory=list, description="Transparent risk factors list")
    recommendedAction: str = Field(..., description="CONTINUE_MONITORING, INVESTIGATE_NODE, or UTILITY_ALERT_AND_ISOLATION_RECOMMENDATION")


class LocalizationSchema(BaseModel):
    localizationType: str = Field(..., description="NODE_LEVEL or NOMINAL")
    nodeId: str = Field(..., description="Reporting node ID")
    location: str = Field(..., description="Geographic junction/location name")
    feeder: str = Field(..., description="Feeder line name")
    estimatedSection: Optional[str] = None
    disclaimer: str = Field(..., description="Prototype single-node disclosure notice")


class ExplanationSchema(BaseModel):
    summary: str = Field(..., description="Evidence-driven text summary")
    evidence: List[str] = Field(..., description="Detailed evidence factors list")
    recommendedAction: str = Field(..., description="Recommended utility action")


class TelemetryResponse(BaseModel):
    nodeId: str
    timestamp: str
    simulated: bool
    detection: DetectionResultSchema
    faultClassification: Optional[FaultClassificationSchema] = None
    risk: Optional[RiskSchema] = None
    localization: Optional[LocalizationSchema] = None
    explanation: Optional[ExplanationSchema] = None
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
    faultClassification: Optional[FaultClassificationSchema] = None
    risk: Optional[RiskSchema] = None
    localization: Optional[LocalizationSchema] = None
    explanation: Optional[ExplanationSchema] = None


class AlertSchema(BaseModel):
    id: str
    severity: str  # CRITICAL, WARNING, INFO
    type: str
    nodeId: str
    message: str
    timestamp: str
    acknowledged: bool = False
    faultType: Optional[str] = None
    riskLevel: Optional[str] = None
    riskScore: Optional[float] = None
    recommendedAction: Optional[str] = None


class EventSchema(BaseModel):
    id: str
    nodeId: str
    type: str  # HIF_DETECTED, FAULT_DETECTED, HEARTBEAT_TIMEOUT, SYSTEM
    severity: str  # CRITICAL, WARNING, INFO
    message: str
    timestamp: str
    details: Optional[Dict] = None
