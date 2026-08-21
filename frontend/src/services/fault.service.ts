// ============================================================
// GridSenti — Fault Service
// TODO: Implement real API calls in later phase
// ============================================================

import type { FaultEvent, HIFDetection } from "@/types";

/**
 * Fetch all active fault events.
 * TODO: Call GET /api/faults?status=active
 */
export async function getActiveFaults(): Promise<FaultEvent[]> {
  // TODO: return apiGet<FaultEvent[]>("/faults?status=active");
  throw new Error("[fault.service] getActiveFaults — not implemented yet");
}

/**
 * Fetch HIF detections for a node.
 * TODO: Call GET /api/faults/hif/:nodeId
 */
export async function getHIFDetections(
  nodeId: string,
): Promise<HIFDetection[]> {
  // TODO: implement
  throw new Error(
    `[fault.service] getHIFDetections(${nodeId}) — not implemented yet`,
  );
}
