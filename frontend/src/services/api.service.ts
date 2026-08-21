// ============================================================
// GridSenti — Base API Service
// TODO: Implement real HTTP client (fetch / axios) in later phase
// ============================================================

import { APP_CONFIG } from "@/config/app.config";

/**
 * Generic GET helper.
 * TODO: Implement real fetch with error handling, auth headers, retry logic.
 */
export async function apiGet<T>(path: string): Promise<T> {
  // TODO: Replace with real fetch call
  const url = `${APP_CONFIG.api.baseUrl}${path}`;
  console.debug("[API] GET", url);

  // Placeholder — throws so callers know it is not yet implemented
  throw new Error(`[api.service] Not implemented yet: GET ${url}`);
}

/**
 * Generic POST helper.
 * TODO: Implement real fetch with JSON body, error handling, auth headers.
 */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  // TODO: Replace with real fetch call
  const url = `${APP_CONFIG.api.baseUrl}${path}`;
  console.debug("[API] POST", url, body);

  throw new Error(`[api.service] Not implemented yet: POST ${url}`);
}
