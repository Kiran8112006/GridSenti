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
    timeout: 10_000, // ms
  },

  environment: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",

  /** Whether the current build uses simulated/mock data */
  isPrototype: true,

  /** Refresh interval for telemetry polling (ms) */
  telemetryPollInterval: 5_000,

  /** Heartbeat timeout — node marked OFFLINE after this (ms) */
  heartbeatTimeoutMs: 30_000,
} as const;

export type AppConfig = typeof APP_CONFIG;
