// ============================================================
// GridSenti — Base API Service
// Real HTTP client using fetch() for FastAPI backend calls.
// ============================================================

import { APP_CONFIG } from "@/config/app.config";

export class ApiDisconnectedError extends Error {
  constructor(message: string = "BACKEND DISCONNECTED") {
    super(message);
    this.name = "ApiDisconnectedError";
  }
}

/**
 * Generic GET helper calling FastAPI backend.
 * Throws ApiDisconnectedError if backend cannot be reached.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const url = `${APP_CONFIG.api.baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.api.timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API GET ${path} failed with status ${response.status}`);
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.warn(`[api.service] Connection failed: GET ${url}`, error);
    throw new ApiDisconnectedError(
      `Unable to connect to backend at ${url}`
    );
  }
}

/**
 * Generic POST helper calling FastAPI backend.
 * Throws ApiDisconnectedError if backend cannot be reached.
 */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const url = `${APP_CONFIG.api.baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.api.timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API POST ${path} failed with status ${response.status}`);
    }

    const data = (await response.json()) as TResponse;
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.warn(`[api.service] Connection failed: POST ${url}`, error);
    throw new ApiDisconnectedError(
      `Unable to connect to backend at ${url}`
    );
  }
}
