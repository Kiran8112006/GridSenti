// ============================================================
// GridSenti — Telemetry Service
// TODO: Implement real API / WebSocket telemetry in later phase
// ============================================================

import type { TelemetryPacket } from "@/types";

/**
 * Fetch the latest telemetry packet for a node.
 * TODO: Call GET /api/telemetry/:nodeId/latest
 */
export async function getLatestTelemetry(
  nodeId: string,
): Promise<TelemetryPacket> {
  // TODO: return apiGet<TelemetryPacket>(`/telemetry/${nodeId}/latest`);
  throw new Error(
    `[telemetry.service] getLatestTelemetry(${nodeId}) — not implemented yet`,
  );
}

/**
 * Fetch historical telemetry for a node.
 * TODO: Call GET /api/telemetry/:nodeId?from=...&to=...
 */
export async function getTelemetryHistory(
  nodeId: string,
  _from: string,
  _to: string,
): Promise<TelemetryPacket[]> {
  // TODO: implement
  throw new Error(
    `[telemetry.service] getTelemetryHistory(${nodeId}) — not implemented yet`,
  );
}
