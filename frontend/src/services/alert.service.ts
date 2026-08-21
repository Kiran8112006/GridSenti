// ============================================================
// GridSenti — Alert Service
// TODO: Implement real API calls in later phase
// ============================================================

import type { Alert } from "@/types";

/**
 * Fetch all unacknowledged alerts.
 * TODO: Call GET /api/alerts?acknowledged=false
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  // TODO: return apiGet<Alert[]>("/alerts?acknowledged=false");
  throw new Error("[alert.service] getActiveAlerts — not implemented yet");
}

/**
 * Acknowledge an alert.
 * TODO: Call PATCH /api/alerts/:id/acknowledge
 */
export async function acknowledgeAlert(id: string): Promise<void> {
  // TODO: return apiPost(`/alerts/${id}/acknowledge`, {});
  throw new Error(
    `[alert.service] acknowledgeAlert(${id}) — not implemented yet`,
  );
}
