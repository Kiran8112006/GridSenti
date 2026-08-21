import type { Alert } from "@/types";
import { alertSeverityColor, timeAgo } from "@/utils";

interface AlertPanelProps {
  alerts: Alert[];
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>🔔</span> Active Alerts
        {alerts.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            {alerts.length}
          </span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 text-center text-slate-500 text-sm">
          No active alerts
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${alertSeverityColor(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  {timeAgo(alert.timestamp)}
                </span>
              </div>
              <p className="text-slate-200 text-sm">{alert.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-slate-500 text-xs font-mono">
                  {alert.nodeId}
                </span>
                {!alert.acknowledged && (
                  <span className="text-xs text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Unacknowledged
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
