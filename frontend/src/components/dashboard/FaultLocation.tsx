// Placeholder for future interactive fault localization map
// TODO: Integrate Leaflet.js or Mapbox to render fault locations

interface FaultLocationProps {
  /** Estimated fault latitude */
  latitude?: number;
  /** Estimated fault longitude */
  longitude?: number;
  nodeId?: string | null;
}

export default function FaultLocation({
  latitude,
  longitude,
  nodeId,
}: FaultLocationProps) {
  return (
    <section>
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-signal">◎</span> Fault Location
      </h2>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        {/* Map placeholder */}
        <div className="h-64 bg-paper flex flex-col items-center justify-center gap-3 relative">
          {/* Grid lines to suggest a map */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(18,24,29,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(18,24,29,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-panel border-2 border-warning flex items-center justify-center text-warning text-lg">
              ◎
            </div>
            {nodeId ? (
              <>
                <p className="text-warning text-sm font-display font-semibold uppercase tracking-wide">
                  Estimated fault near {nodeId}
                </p>
                {latitude && longitude && (
                  <p className="text-steel text-xs font-mono meter bg-panel border border-line rounded px-2 py-1">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-steel text-sm">No active fault location</p>
            )}
            <p className="text-steel-light text-xs mt-1">
              Interactive map — coming in next phase
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-line flex items-center justify-between">
          <span className="text-steel text-xs">
            Localization: rule-based triangulation (planned)
          </span>
          <span className="text-steel-light text-xs font-mono">TODO</span>
        </div>
      </div>
    </section>
  );
}
