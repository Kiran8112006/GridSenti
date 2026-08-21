// ============================================================
// GridSenti — Mock / Simulated Data
// This file provides MOCK data for the dashboard skeleton.
// All electrical values are SIMULATED.
// ============================================================

import type {
  MonitoringNode,
  TelemetryPacket,
  FaultEvent,
  Alert,
  SystemStatus,
} from "@/types";

// ── Mock Nodes ───────────────────────────────────────────────

export const MOCK_NODES: MonitoringNode[] = [
  {
    nodeId: "GS-NODE-001",
    id: "GS-NODE-001",
    name: "Node Alpha",
    latitude: 28.6139,
    longitude: 77.209,
    status: "ONLINE",
    lastHeartbeat: new Date(Date.now() - 2_000).toISOString(),
    location: "Sector 4, Feeder Line A",
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-002",
    id: "GS-NODE-002",
    name: "Node Beta",
    latitude: 28.6229,
    longitude: 77.208,
    status: "ONLINE",
    lastHeartbeat: new Date(Date.now() - 5_000).toISOString(),
    location: "Sector 7, Feeder Line B",
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-003",
    id: "GS-NODE-003",
    name: "Node Gamma",
    latitude: 28.635,
    longitude: 77.225,
    status: "WARNING",
    lastHeartbeat: new Date(Date.now() - 12_000).toISOString(),
    location: "Sector 12, Feeder Line C",
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-004",
    id: "GS-NODE-004",
    name: "Node Delta",
    latitude: 28.641,
    longitude: 77.195,
    status: "OFFLINE",
    lastHeartbeat: new Date(Date.now() - 120_000).toISOString(),
    location: "Sector 19, Feeder Line D",
    firmwareVersion: "0.1.0",
  },
];

// ── Mock Telemetry ───────────────────────────────────────────

export const MOCK_TELEMETRY: TelemetryPacket[] = [
  {
    nodeId: "GS-NODE-001",
    timestamp: new Date().toISOString(),
    current: 24.8,
    voltage: 230.0,
    waveformAnomaly: 0.05,
    status: "NORMAL",
    rssi: -62,
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-002",
    timestamp: new Date().toISOString(),
    current: 23.1,
    voltage: 229.5,
    waveformAnomaly: 0.03,
    status: "NORMAL",
    rssi: -70,
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-003",
    timestamp: new Date().toISOString(),
    current: 26.1,
    voltage: 227.5,
    waveformAnomaly: 0.82,
    status: "POSSIBLE_HIF",
    rssi: -75,
    firmwareVersion: "0.1.0",
  },
  {
    nodeId: "GS-NODE-004",
    timestamp: new Date(Date.now() - 120_000).toISOString(),
    current: 0,
    voltage: 0,
    waveformAnomaly: 0,
    status: "NORMAL",
    rssi: 0,
    firmwareVersion: "0.1.0",
  },
];

// ── Mock Alerts ──────────────────────────────────────────────

export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALT-001",
    nodeId: "GS-NODE-003",
    severity: "WARNING",
    message:
      "Possible HIF detected near GS-NODE-003. Waveform anomaly index: 0.82",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    acknowledged: false,
    relatedFaultId: "FLT-001",
  },
];

// ── Mock Fault Events ────────────────────────────────────────

export const MOCK_FAULTS: FaultEvent[] = [
  {
    id: "FLT-001",
    nodeId: "GS-NODE-003",
    type: "HIF",
    confidence: 0.82,
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    status: "POSSIBLE_HIF",
    description:
      "Elevated waveform anomaly index detected. Manual verification required.",
    estimatedLatitude: 28.635,
    estimatedLongitude: 77.225,
  },
];

// ── Mock System Status ───────────────────────────────────────

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  state: "DEGRADED",
  totalNodes: 4,
  onlineNodes: 2,
  warningNodes: 1,
  offlineNodes: 1,
  activeAlerts: 1,
  lastUpdated: new Date().toISOString(),
};

// ── Recent Events (for timeline) ─────────────────────────────

export const MOCK_EVENTS = [
  {
    id: "EVT-001",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    type: "WARNING",
    message: "Possible HIF detected at GS-NODE-003",
    nodeId: "GS-NODE-003",
  },
  {
    id: "EVT-002",
    timestamp: new Date(Date.now() - 300_000).toISOString(),
    type: "INFO",
    message: "GS-NODE-004 went offline — heartbeat timeout",
    nodeId: "GS-NODE-004",
  },
  {
    id: "EVT-003",
    timestamp: new Date(Date.now() - 600_000).toISOString(),
    type: "INFO",
    message: "System started — 4 nodes registered",
    nodeId: null,
  },
];
