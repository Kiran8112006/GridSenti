// HIF Detection Status panel
// TODO: Wire up real detection pipeline results in later phase

interface HIFStatusPanelProps {
  isDetecting?: boolean;
  confidence?: number | null;
  nodeId?: string | null;
  detectionMethod?: "RULE_BASED" | "ML" | "HYBRID" | "PENDING";
}

export default function HIFStatusPanel({
  isDetecting = false,
  confidence = null,
  nodeId = null,
  detectionMethod = "PENDING",
}: HIFStatusPanelProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>⚡</span> HIF Detection Status
      </h2>

      <div
        className={`bg-slate-800/60 border rounded-xl p-4 flex flex-col gap-3 ${
          isDetecting ? "border-amber-500/30" : "border-slate-700/60"
        }`}
      >
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Detection Engine</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400 border border-slate-600">
            {detectionMethod}
          </span>
        </div>

        {isDetecting && nodeId ? (
          <>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-300 text-sm font-semibold">
                ⚡ Possible HIF Detected
              </p>
              <p className="text-amber-400/70 text-xs mt-1">
                Node: <span className="font-mono">{nodeId}</span>
              </p>
              {confidence !== null && (
                <p className="text-amber-400/70 text-xs">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
            <p className="text-slate-500 text-xs">
              Manual field verification required. Do NOT approach downed conductors.
            </p>
          </>
        ) : (
          <div className="text-center py-3">
            <span className="text-emerald-400 text-sm font-medium">
              ✓ No HIF Detected
            </span>
            <p className="text-slate-600 text-xs mt-1">
              Rule-based & ML engine — not yet implemented
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
