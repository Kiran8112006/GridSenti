// ============================================================
// GridSenti — Telemetry Service
// Calls GET /api/detection/node/:nodeId and GET /api/detection/latest
// ============================================================

import { apiGet, ApiDisconnectedError } from "./api.service";
import { APP_CONFIG } from "@/config/app.config";
import type { TelemetryPacket } from "@/types";

export async function getLatestTelemetry(
  nodeId: string,
): Promise<TelemetryPacket | null> {
  try {
    const res = await apiGet<{ latestTelemetry?: TelemetryPacket }>(
      `/detection/node/${nodeId}`
    );
    return res.latestTelemetry ?? null;
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      console.warn("[telemetry.service] Backend disconnected. Using mock fallback.");
      return null;
    }
    throw error;
  }
}
