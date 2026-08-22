// ============================================================
// GridSenti — Application Configuration
// ============================================================

export const APP_CONFIG = {
  name: "GridSenti",
  fullName: "GridSenti — Intelligent Grid Safety Monitoring",
  description:
    "AI-Assisted Detection & Localization of Invisible High-Impedance Downed Conductors",
  version: "0.1.0-prototype",

  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
    timeout: 5_000, // ms
  },

  environment: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",

  /** Whether the current build uses simulated/mock data */
  isPrototype: true,

  /** Explicit dev configuration flag for mock fallback. MUST be false by default to enforce live status. */
  useMockFallback: process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === "true",

  /** Refresh interval for live backend polling (ms) */
  pollingIntervalMs: 2_000,

  /** Heartbeat timeout — node marked OFFLINE after this (ms) */
  heartbeatTimeoutMs: 10_000,
} as const;

export type AppConfig = typeof APP_CONFIG;
