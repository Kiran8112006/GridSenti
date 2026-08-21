// ============================================================
// GridSenti — Fault & Events Service
// Calls GET /api/events and GET /api/detection/latest
// ============================================================

import { apiGet } from "./api.service";
import { APP_CONFIG } from "@/config/app.config";
import type { EventLogItem, FaultClassification, RiskAnalysis, LocalizationInfo, ExplanationInfo } from "@/types";

export async function getRecentEvents(limit: number = 50): Promise<EventLogItem[]> {
  try {
    const rawEvents = await apiGet<
      Array<{
        id: string;
        nodeId: string;
        type: string;
        severity: "CRITICAL" | "WARNING" | "INFO";
        message: string;
        timestamp: string;
        details?: any;
      }>
    >(`/events?limit=${limit}`);

    return rawEvents.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      nodeId: e.nodeId,
      type: e.severity,
      message: e.message,
      details: e.details,
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
  faultClassification?: FaultClassification | null;
  risk?: RiskAnalysis | null;
  localization?: LocalizationInfo | null;
  explanation?: ExplanationInfo | null;
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
