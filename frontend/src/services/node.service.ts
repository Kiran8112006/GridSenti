// ============================================================
// GridSenti — Node Service
// Real API integration for GET /api/nodes
// ============================================================

import { apiGet, ApiDisconnectedError } from "./api.service";
import { APP_CONFIG } from "@/config/app.config";
import { MOCK_NODES } from "@/lib/mock-data";
import type { MonitoringNode } from "@/types";

/**
 * Fetch all monitoring nodes from the backend.
 * Calls GET /api/nodes.
 * If backend is unreachable, throws ApiDisconnectedError unless explicit mock fallback flag is set.
 */
export async function getAllNodes(): Promise<MonitoringNode[]> {
  try {
    return await apiGet<MonitoringNode[]>("/nodes");
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      console.warn("[node.service] Backend disconnected. Explicit mock fallback enabled.");
      return MOCK_NODES;
    }
    throw error;
  }
}

/**
 * Fetch a single node by ID.
 * Calls GET /api/nodes/:id.
 */
export async function getNodeById(id: string): Promise<MonitoringNode> {
  try {
    return await apiGet<MonitoringNode>(`/nodes/${id}`);
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      const found = MOCK_NODES.find((n) => n.nodeId === id);
      if (found) return found;
    }
    throw error;
  }
}
