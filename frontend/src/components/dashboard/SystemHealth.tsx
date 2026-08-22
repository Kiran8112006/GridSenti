import type { SystemStatus } from "@/types";
import { systemStateColor } from "@/utils";

interface SystemHealthProps {
  status: SystemStatus;
  backendStatus?: "CONNECTED" | "DISCONNECTED";
  mlModelStatus?: "READY" | "NOT_READY";
}

export default function SystemHealth({
  status,
  backendStatus = "DISCONNECTED",
  mlModelStatus = "READY",
}: SystemHealthProps) {
  const uptimePct =
    status.totalNodes > 0
      ? Math.round((status.onlineNodes / status.totalNodes) * 100)
      : 0;

  return (
    <section>
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-signal">⚙</span> System Health
      </h2>

      <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-4">
        {/* Overall state */}
        <div className="flex items-center justify-between">
          <span className="text-steel text-sm">Overall State</span>
          <span
            className={`text-sm font-display font-bold uppercase tracking-wide ${systemStateColor(status.state)}`}
          >
            {status.state}
          </span>
        </div>

        {/* Node uptime bar */}
        <div>
          <div className="flex justify-between text-xs text-steel mb-1">
            <span>Node Availability</span>
            <span className="font-mono meter">{uptimePct}%</span>
          </div>
          <div className="h-2 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                uptimePct >= 75
                  ? "bg-nominal"
                  : uptimePct >= 50
                    ? "bg-warning"
                    : "bg-critical"
              }`}
              style={{ width: `${uptimePct}%` }}
            />
          </div>
        </div>

        {/* Breakdown table */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: "Online", value: status.onlineNodes, color: "text-nominal" },
            { label: "Warning", value: status.warningNodes, color: "text-warning" },
            { label: "Offline", value: status.offlineNodes, color: "text-offline" },
            { label: "Alerts", value: status.activeAlerts, color: "text-critical" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between bg-paper border border-line rounded-md px-2.5 py-1.5"
            >
              <span className="text-steel">{row.label}</span>
              <span className={`font-mono meter font-semibold ${row.color}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Backend & ML Health */}
        <div className="flex flex-col gap-1.5 text-xs border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-steel">Backend API</span>
            <span
              className={`font-mono meter font-semibold flex items-center gap-1.5 ${
                backendStatus === "CONNECTED" ? "text-nominal" : "text-critical"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === "CONNECTED" ? "bg-nominal" : "bg-critical"
                }`}
              />
              {backendStatus === "CONNECTED" ? "ONLINE" : "DISCONNECTED"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-steel">ML Engine (Random Forest)</span>
            <span
              className={`font-mono meter font-semibold flex items-center gap-1.5 ${
                mlModelStatus === "READY" ? "text-nominal" : "text-warning"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mlModelStatus === "READY" ? "bg-nominal" : "bg-warning"
                }`}
              />
              {mlModelStatus === "READY" ? "LOADED & ACTIVE" : "PENDING"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
