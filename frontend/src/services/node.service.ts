// ============================================================
// GridSenti — Node Service
// TODO: Implement real API calls in later phase
// ============================================================

import type { MonitoringNode } from "@/types";

/**
 * Fetch all monitoring nodes from the backend.
 * TODO: Call GET /api/nodes
 */
export async function getAllNodes(): Promise<MonitoringNode[]> {
  // TODO: return apiGet<MonitoringNode[]>("/nodes");
  throw new Error("[node.service] getAllNodes — not implemented yet");
}

/**
 * Fetch a single node by ID.
 * TODO: Call GET /api/nodes/:id
 */
export async function getNodeById(id: string): Promise<MonitoringNode> {
  // TODO: return apiGet<MonitoringNode>(`/nodes/${id}`);
  throw new Error(`[node.service] getNodeById(${id}) — not implemented yet`);
}
