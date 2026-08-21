// HIF Detection Status panel
// Displays real-time detection results from backend (Random Forest + Rule Engine)

interface HIFStatusPanelProps {
  isDetecting?: boolean;
  confidence?: number | null;
  ruleScore?: number | null;
  nodeId?: string | null;
  detectionMethod?: "RULE_BASED" | "ML" | "HYBRID" | "PENDING";
  reasons?: string[];
}

export default function HIFStatusPanel({
  isDetecting = false,
  confidence = null,
  ruleScore = null,
  nodeId = null,
  detectionMethod = "HYBRID",
  reasons = [],
}: HIFStatusPanelProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>⚡</span> HIF Detection Status
      </h2>

      <div
        className={`bg-slate-800/60 border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
          isDetecting ? "border-red-500/50 bg-red-950/20" : "border-slate-700/60"
        }`}
      >
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Detection Engine</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
            {detectionMethod}
          </span>
        </div>

        {isDetecting && nodeId ? (
          <>
            <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-red-300 text-sm font-semibold flex items-center gap-1.5">
                  <span className="animate-pulse">🔴</span> Possible HIF Detected
                </p>
                <span className="text-xs font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                  CRITICAL
                </span>
              </div>

              <p className="text-slate-300 text-xs mt-2">
                Node: <span className="font-mono text-cyan-300 font-bold">{nodeId}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-red-500/20 text-xs">
                <div>
                  <span className="text-slate-400">ML Probability: </span>
                  <span className="font-semibold text-red-400 font-mono">
                    {confidence !== null ? `${(confidence * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Rule Score: </span>
                  <span className="font-semibold text-amber-400 font-mono">
                    {ruleScore !== null ? `${ruleScore.toFixed(1)} / 100` : "N/A"}
                  </span>
                </div>
              </div>

              {reasons.length > 0 && (
                <div className="mt-2 text-xs text-amber-300/80 bg-amber-950/30 p-2 rounded border border-amber-500/20">
                  <p className="font-semibold text-amber-400 mb-1">Trigger Reasons:</p>
                  <ul className="list-disc list-inside space-y-0.5 font-mono">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs">
              ⚠️ Safety warning: Manual field verification required. Do NOT approach downed conductors.
            </p>
          </>
        ) : (
          <div className="text-center py-4 bg-emerald-950/10 rounded-lg border border-emerald-500/20">
            <span className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-1.5">
              <span>🟢</span> No HIF Detected
            </span>
            <p className="text-slate-400 text-xs mt-1">
              Electrical wave features nominal across all monitored phases.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
