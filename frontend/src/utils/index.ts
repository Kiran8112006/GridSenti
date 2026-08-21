// ============================================================
// GridSenti — Utility Functions
// ============================================================

import type { NodeStatus, AlertSeverity, SystemState } from "@/types";

/**
 * Format an ISO timestamp for display.
 */
export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Returns a human-readable "time ago" string.
 */
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Map NodeStatus to a CSS colour class (Tailwind).
 */
export function nodeStatusColor(status: NodeStatus): string {
  switch (status) {
    case "ONLINE":
      return "text-emerald-400";
    case "WARNING":
      return "text-amber-400";
    case "OFFLINE":
      return "text-slate-500";
    case "UNKNOWN":
    default:
      return "text-slate-400";
  }
}

/**
 * Map NodeStatus to a dot indicator class.
 */
export function nodeStatusDot(status: NodeStatus): string {
  switch (status) {
    case "ONLINE":
      return "bg-emerald-400";
    case "WARNING":
      return "bg-amber-400";
    case "OFFLINE":
      return "bg-slate-600";
    default:
      return "bg-slate-400";
  }
}

/**
 * Map AlertSeverity to a colour class.
 */
export function alertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "text-red-400";
    case "WARNING":
      return "text-amber-400";
    case "INFO":
    default:
      return "text-sky-400";
  }
}

/**
 * Map SystemState to a colour class.
 */
export function systemStateColor(state: SystemState): string {
  switch (state) {
    case "NOMINAL":
      return "text-emerald-400";
    case "DEGRADED":
      return "text-amber-400";
    case "CRITICAL":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

/**
 * Map NodeStatus to an emoji indicator.
 */
export function nodeStatusEmoji(status: NodeStatus): string {
  switch (status) {
    case "ONLINE":
      return "🟢";
    case "WARNING":
      return "🟡";
    case "OFFLINE":
      return "⚫";
    default:
      return "❓";
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
