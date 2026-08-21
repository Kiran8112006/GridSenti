import type { SystemStatus } from "@/types";
import { systemStateColor } from "@/utils";

interface SystemHealthProps {
  status: SystemStatus;
}

export default function SystemHealth({ status }: SystemHealthProps) {
  const uptimePct =
    status.totalNodes > 0
      ? Math.round((status.onlineNodes / status.totalNodes) * 100)
      : 0;

  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>⚙</span> System Health
      </h2>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-4">
        {/* Overall state */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Overall State</span>
          <span
            className={`text-sm font-bold ${systemStateColor(status.state)}`}
          >
            {status.state}
          </span>
        </div>

        {/* Node uptime bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Node Availability</span>
            <span className="font-mono">{uptimePct}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                uptimePct >= 75
                  ? "bg-emerald-500"
                  : uptimePct >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${uptimePct}%` }}
            />
          </div>
        </div>

        {/* Breakdown table */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: "Online", value: status.onlineNodes, color: "text-emerald-400" },
            { label: "Warning", value: status.warningNodes, color: "text-amber-400" },
            { label: "Offline", value: status.offlineNodes, color: "text-slate-500" },
            { label: "Alerts", value: status.activeAlerts, color: "text-red-400" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between bg-slate-900/50 rounded-lg px-2.5 py-1.5"
            >
              <span className="text-slate-500">{row.label}</span>
              <span className={`font-mono font-semibold ${row.color}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Backend health placeholder */}
        <div className="flex items-center justify-between text-xs border-t border-slate-700/60 pt-3">
          <span className="text-slate-500">Backend API</span>
          <span className="text-slate-600 italic">Not connected (skeleton)</span>
        </div>
      </div>
    </section>
  );
}
