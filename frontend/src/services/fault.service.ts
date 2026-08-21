// ============================================================
// GridSenti — Fault & Events Service
// Calls GET /api/events and GET /api/detection/latest
// ============================================================

import { apiGet } from "./api.service";
import { APP_CONFIG } from "@/config/app.config";
import type { EventLogItem, HIFDetection } from "@/types";

export async function getRecentEvents(): Promise<EventLogItem[]> {
  try {
    const rawEvents = await apiGet<
      Array<{
        id: string;
        nodeId: string;
        type: string;
        severity: "CRITICAL" | "WARNING" | "INFO";
        message: string;
        timestamp: string;
      }>
    >("/events");

    return rawEvents.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      nodeId: e.nodeId,
      type: e.severity,
      message: e.message,
    }));
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      console.warn("[fault.service] Backend disconnected. Explicit mock fallback enabled.");
      return [];
    }
    throw error;
  }
}

export async function getLatestSystemDetection(): Promise<{
  nodeId?: string;
  timestamp?: string;
  simulated?: boolean;
  nodeStatus?: string;
  detection?: {
    classification: string;
    model_probability: Record<string, number>;
    rule_score: number;
    rule_classification: string;
    reasons: string[];
  };
} | null> {
  try {
    const res = await apiGet<any>("/detection/latest");
    if (res.status === "NO_TELEMETRY") return null;
    return res;
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      return null;
    }
    throw error;
  }
}
