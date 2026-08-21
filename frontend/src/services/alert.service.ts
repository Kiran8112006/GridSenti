// ============================================================
// GridSenti — Alert Service
// Calls GET /api/alerts
// ============================================================

import { apiGet } from "./api.service";
import { APP_CONFIG } from "@/config/app.config";
import { MOCK_ALERTS } from "@/lib/mock-data";
import type { Alert } from "@/types";

export async function getActiveAlerts(): Promise<Alert[]> {
  try {
    return await apiGet<Alert[]>("/alerts");
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      console.warn("[alert.service] Backend disconnected. Explicit mock fallback enabled.");
      return MOCK_ALERTS;
    }
    throw error;
  }
}
