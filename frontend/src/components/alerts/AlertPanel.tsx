import type { Alert } from "@/types";
import { alertSeverityColor, timeAgo } from "@/utils";

interface AlertPanelProps {
  alerts: Alert[];
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <section>
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-critical">◆</span> Active Alerts
        {alerts.length > 0 && (
          <span className="px-1.5 py-0.5 rounded text-xs font-mono meter bg-critical-light text-critical border border-critical/20">
            {alerts.length}
          </span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <div className="bg-panel border border-line rounded-lg p-6 text-center text-steel-light text-sm">
          No active alerts
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-panel border border-line border-l-4 border-l-warning rounded-lg p-4 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-display font-bold uppercase tracking-wide ${alertSeverityColor(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span className="text-steel-light text-xs font-mono meter">
                  {timeAgo(alert.timestamp)}
                </span>
              </div>
              <p className="text-ink text-sm">{alert.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-steel-light text-xs font-mono">
                  {alert.nodeId}
                </span>
                {!alert.acknowledged && (
                  <span className="text-xs font-display uppercase tracking-wide text-warning border border-warning/30 px-2 py-0.5 rounded">
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
