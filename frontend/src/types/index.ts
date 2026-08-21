// ============================================================
// GridSenti — Core TypeScript Types
// ============================================================

export type NodeStatus = "ONLINE" | "WARNING" | "OFFLINE" | "UNKNOWN";

export type FaultStatus =
  | "NORMAL"
  | "POSSIBLE_HIF"
  | "CONFIRMED_HIF"
  | "INVESTIGATING"
  | "RESOLVED";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type SystemState = "NOMINAL" | "DEGRADED" | "CRITICAL";

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
  lastHeartbeat?: string | null;
  lastDetection?: string | null;
  latestTelemetry?: any;
  latestDetectionResult?: any;
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
  type: "HIF" | "OVERCURRENT" | "UNDERVOLTAGE" | "ANOMALY" | "UNKNOWN";
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
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  relatedFaultId?: string;
}

// ── Event Timeline Log Item ──────────────────────────────────

export interface EventLogItem {
  id: string;
  timestamp: string;
  nodeId: string | null;
  type: string;
  message: string;
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
