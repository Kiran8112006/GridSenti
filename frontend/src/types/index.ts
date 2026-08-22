// ============================================================
// GridSenti — Core TypeScript Types
// ============================================================

export type NodeStatus = "ONLINE" | "WARNING" | "OFFLINE" | "UNKNOWN";

export type CommunicationState = "REMOTE_CONNECTED" | "LOCAL_FALLBACK" | "REMOTE_UNAVAILABLE";

export type IsolationStatusType = "NOT_ISOLATED" | "ISOLATION_RECOMMENDED" | "ISOLATED";

export type FaultStatus =
  | "NORMAL"
  | "POSSIBLE_HIF"
  | "CONFIRMED_HIF"
  | "INVESTIGATING"
  | "RESOLVED";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type SystemState = "NOMINAL" | "DEGRADED" | "CRITICAL";

// ── Multi-Class Fault Classification ─────────────────────────

export interface FaultClassification {
  faultType: string;
  faultTypeProbability: number;
  faultTypeProbabilities: Record<string, number>;
}

// ── Risk Analysis ────────────────────────────────────────────

export interface RiskAnalysis {
  level: "LOW" | "MEDIUM" | "CRITICAL";
  score: number;
  components: {
    mlEvidence: number;
    ruleEvidence: number;
    persistenceEvidence: number;
  };
  persistenceCount: number;
  reasons: string[];
  recommendedAction: string;
}

// ── Localization Info ────────────────────────────────────────

export interface LocalizationInfo {
  localizationType: string;
  nodeId: string;
  location: string;
  feeder: string;
  estimatedSection?: string;
  disclaimer: string;
}

// ── Explanation Info ─────────────────────────────────────────

export interface ExplanationInfo {
  summary: string;
  evidence: string[];
  recommendedAction: string;
}

// ── Software Isolation Info ──────────────────────────────────

export interface IsolationInfo {
  nodeId: string;
  status: IsolationStatusType;
  simulated: boolean;
  timestamp: string;
  message: string;
}

// ── Public Safety Warning Info ───────────────────────────────

export interface PublicWarning {
  warningId: string;
  nodeId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  location: string;
  timestamp: string;
  simulated: boolean;
  status: "ACTIVE" | "RESOLVED";
  resolvedAt?: string | null;
}

// ── Monitoring Node ──────────────────────────────────────────

export interface MonitoringNode {
  nodeId?: string;
  id?: string;
  name: string;
  location?: string;
  feeder?: string;
  latitude?: number;
  longitude?: number;
  status: NodeStatus;
  communicationState?: CommunicationState;
  lastHeartbeat?: string | null;
  lastDetection?: string | null;
  latestTelemetry?: any;
  latestDetectionResult?: any;
  faultClassification?: FaultClassification | null;
  risk?: RiskAnalysis | null;
  localization?: LocalizationInfo | null;
  explanation?: ExplanationInfo | null;
  isolationState?: IsolationInfo | null;
  activeWarning?: PublicWarning | null;
  firmwareVersion?: string;
}

// ── Sensor Reading ───────────────────────────────────────────

export interface SensorReading {
  nodeId: string;
  timestamp: string;
  current: number;
  voltage: number;
  waveformAnomaly: number;
  frequency?: number;
  powerFactor?: number;
}

// ── Telemetry Packet ─────────────────────────────────────────

export interface TelemetryPacket {
  nodeId: string;
  timestamp: string;
  currentA?: number;
  voltageV?: number;
  anomalyIdx?: number;
  rssiDbm?: number;
  current: number;
  voltage: number;
  waveformAnomaly: number;
  status?: FaultStatus;
  snr?: number;
  firmwareVersion?: string;
  rssi?: number;
}

// ── Fault Event ──────────────────────────────────────────────

export interface FaultEvent {
  id: string;
  nodeId: string;
  type: string;
  confidence: number;
  timestamp: string;
  status: FaultStatus;
  description?: string;
  estimatedLatitude?: number;
  estimatedLongitude?: number;
}

// ── HIF Detection ────────────────────────────────────────────

export interface HIFDetection {
  id: string;
  nodeId: string;
  timestamp: string;
  confidence: number;
  features: {
    currentThd?: number;
    voltageThd?: number;
    waveformAnomaly?: number;
    [key: string]: number | undefined;
  };
  detectionMethod: "RULE_BASED" | "ML" | "HYBRID";
  status: FaultStatus;
}

// ── Alert ────────────────────────────────────────────────────

export interface Alert {
  id: string;
  nodeId: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  relatedFaultId?: string;
  faultType?: string;
  riskLevel?: string;
  riskScore?: number;
  recommendedAction?: string;
  isolationStatus?: string;
  publicWarningId?: string;
}

// ── Event Timeline Log Item ──────────────────────────────────

export interface EventLogItem {
  id: string;
  timestamp: string;
  nodeId: string | null;
  type: string;
  message: string;
  simulated?: boolean;
  details?: any;
}

// ── System Status ────────────────────────────────────────────

export interface SystemStatus {
  state: SystemState;
  totalNodes: number;
  onlineNodes: number;
  warningNodes: number;
  offlineNodes: number;
  activeAlerts: number;
  lastUpdated?: string;
}

// ── API Responses ────────────────────────────────────────────

export interface HealthCheckResponse {
  status: string;
  service: string;
}
