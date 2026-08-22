// ============================================================
// GridSenti — Public Warning Service (Frontend API)
// Calls GET /api/public-warnings, POST /api/public-warnings/simulate, POST /api/public-warnings/{id}/resolve
// ============================================================

import { apiGet, apiPost } from "./api.service";
import type { PublicWarning } from "@/types";

export async function getPublicWarnings(): Promise<PublicWarning[]> {
  try {
    return await apiGet<PublicWarning[]>("/public-warnings");
  } catch (error) {
    console.warn("[publicWarning.service] Failed to fetch public warnings:", error);
    return [];
  }
}

export async function simulatePublicWarning(nodeId: string): Promise<PublicWarning> {
  return await apiPost<{ nodeId: string }, PublicWarning>("/public-warnings/simulate", { nodeId });
}

export async function resolvePublicWarning(warningId: string): Promise<PublicWarning> {
  return await apiPost<Record<string, never>, PublicWarning>(`/public-warnings/${warningId}/resolve`, {});
}
