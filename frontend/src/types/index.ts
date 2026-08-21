// ============================================================
// GridSenti — Core TypeScript Types
// ============================================================
// NOTE: voltage/current fields in these types represent
// SIMULATED readings for the current prototype.
// No physical electrical sensors are connected.
// ============================================================

// ── Node Status ──────────────────────────────────────────────

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
  /** Unique node identifier, e.g. GS-NODE-001 */
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: NodeStatus;
  /** ISO 8601 timestamp of last heartbeat */
  lastHeartbeat: string;
  location?: string;
  /** Firmware version string */
  firmwareVersion?: string;
}

// ── Sensor Reading ───────────────────────────────────────────

/**
 * A single raw reading from a monitoring node.
 * NOTE: All values are SIMULATED in the current prototype.
 */
export interface SensorReading {
  nodeId: string;
  timestamp: string;
  /** Simulated RMS current in Amperes */
  current: number;
  /** Simulated RMS voltage in Volts */
  voltage: number;
  /** Simulated waveform anomaly index [0.0 – 1.0] */
  waveformAnomaly: number;
  /** Simulated frequency in Hz */
  frequency?: number;
  /** Simulated power factor */
  powerFactor?: number;
}

// ── Telemetry Packet ─────────────────────────────────────────

/**
 * Full telemetry payload sent by an edge node (ESP8266).
 * NOTE: All electrical values are SIMULATED.
 */
export interface TelemetryPacket {
  nodeId: string;
  timestamp: string;
  /** Simulated RMS current in Amperes */
  current: number;
  /** Simulated RMS voltage in Volts */
  voltage: number;
  /** Simulated waveform anomaly index [0.0 – 1.0] */
  waveformAnomaly: number;
  status: FaultStatus;
  /** Simulated signal-to-noise ratio */
  snr?: number;
  /** Firmware version of the reporting node */
  firmwareVersion?: string;
  /** RSSI of the node's Wi-Fi connection */
  rssi?: number;
}

// ── Fault Event ──────────────────────────────────────────────

export interface FaultEvent {
  id: string;
  nodeId: string;
  type: "HIF" | "OVERCURRENT" | "UNDERVOLTAGE" | "ANOMALY" | "UNKNOWN";
  /** Detection confidence [0.0 – 1.0] */
  confidence: number;
  timestamp: string;
  status: FaultStatus;
  description?: string;
  /** Estimated fault latitude (future localization) */
  estimatedLatitude?: number;
  /** Estimated fault longitude (future localization) */
  estimatedLongitude?: number;
}

// ── HIF Detection ────────────────────────────────────────────

export interface HIFDetection {
  id: string;
  nodeId: string;
  timestamp: string;
  /** Detection confidence [0.0 – 1.0] */
  confidence: number;
  /** Raw anomaly features used by the detector */
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

// ── System Status ────────────────────────────────────────────

export interface SystemStatus {
  state: SystemState;
  totalNodes: number;
  onlineNodes: number;
  warningNodes: number;
  offlineNodes: number;
  activeAlerts: number;
  lastUpdated: string;
}

// ── API Responses ────────────────────────────────────────────

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
