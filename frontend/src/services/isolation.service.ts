// ============================================================
// GridSenti — Safe Isolation Service (Frontend API)
// Calls GET /api/isolation, POST /api/isolation/simulate, POST /api/isolation/reset
// ============================================================

import { apiGet, apiPost } from "./api.service";
import type { IsolationInfo } from "@/types";

export async function getIsolationStatuses(): Promise<Record<string, IsolationInfo>> {
  try {
    return await apiGet<Record<string, IsolationInfo>>("/isolation");
  } catch (error) {
    console.warn("[isolation.service] Failed to fetch isolation statuses:", error);
    return {};
  }
}

export async function simulateIsolation(nodeId: string): Promise<IsolationInfo> {
  return await apiPost<{ nodeId: string }, IsolationInfo>("/isolation/simulate", { nodeId });
}

export async function resetIsolation(nodeId: string): Promise<IsolationInfo> {
  return await apiPost<{ nodeId: string }, IsolationInfo>("/isolation/reset", { nodeId });
}
