import { timeAgo } from "@/utils";

interface Event {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  nodeId: string | null;
}

interface EventTimelineProps {
  events: Event[];
}

const typeStyles: Record<string, string> = {
  WARNING: "text-warning border-warning/30",
  CRITICAL: "text-critical border-critical/30",
  INFO: "text-signal border-signal/30",
};

const typeDot: Record<string, string> = {
  WARNING: "bg-warning",
  CRITICAL: "bg-critical",
  INFO: "bg-signal",
};

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <section>
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-signal">▤</span> Recent Events
      </h2>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        {events.length === 0 ? (
          <div className="p-6 text-center text-steel-light text-sm">
            No recent events
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 p-3">
                {/* Timeline dot */}
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot[event.type] ?? "bg-offline"}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-ink text-sm leading-snug">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.nodeId && (
                      <span className="text-steel-light text-xs font-mono">
                        {event.nodeId}
                      </span>
                    )}
                    <span className="text-steel-light text-xs">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-display font-medium uppercase tracking-wide ${typeStyles[event.type] ?? "text-steel border-line"}`}
                >
                  {event.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
