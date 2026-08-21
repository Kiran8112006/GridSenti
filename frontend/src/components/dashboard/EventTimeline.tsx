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
  WARNING: "text-amber-400 border-amber-500/40",
  CRITICAL: "text-red-400 border-red-500/40",
  INFO: "text-sky-400 border-sky-500/40",
};

const typeDot: Record<string, string> = {
  WARNING: "bg-amber-400",
  CRITICAL: "bg-red-400",
  INFO: "bg-sky-400",
};

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>⏱</span> Recent Events
      </h2>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        {events.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No recent events
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/60">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3 p-3">
                {/* Timeline dot */}
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${typeDot[event.type] ?? "bg-slate-500"}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm leading-snug">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.nodeId && (
                      <span className="text-slate-500 text-xs font-mono">
                        {event.nodeId}
                      </span>
                    )}
                    <span className="text-slate-600 text-xs">
                      {timeAgo(event.timestamp)}
                    </span>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium ${typeStyles[event.type] ?? "text-slate-400 border-slate-600"}`}
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
