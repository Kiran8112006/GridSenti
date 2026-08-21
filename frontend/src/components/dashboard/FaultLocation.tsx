// Placeholder for future interactive fault localization map
// TODO: Integrate Leaflet.js or Mapbox to render fault locations

interface FaultLocationProps {
  /** Estimated fault latitude */
  latitude?: number;
  /** Estimated fault longitude */
  longitude?: number;
  nodeId?: string;
}

export default function FaultLocation({
  latitude,
  longitude,
  nodeId,
}: FaultLocationProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>📍</span> Fault Location
      </h2>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        {/* Map placeholder */}
        <div className="h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3 relative">
          {/* Grid lines to suggest a map */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              📍
            </div>
            {nodeId ? (
              <>
                <p className="text-amber-400 text-sm font-semibold">
                  Estimated fault near {nodeId}
                </p>
                {latitude && longitude && (
                  <p className="text-slate-400 text-xs font-mono">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-500 text-sm">No active fault location</p>
            )}
            <p className="text-slate-600 text-xs mt-1">
              Interactive map — coming in next phase
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            Localization: rule-based triangulation (planned)
          </span>
          <span className="text-slate-600 text-xs font-mono">TODO</span>
        </div>
      </div>
    </section>
  );
}
