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
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-warning">▲</span> HIF Detection Status
      </h2>

      <div
        className={`bg-panel border rounded-lg p-4 flex flex-col gap-3 transition-colors ${
          isDetecting ? "border-l-4 border-l-critical border-line bg-critical-light" : "border-line"
        }`}
      >
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-steel text-sm">Detection Engine</span>
          <span className="px-2 py-0.5 rounded text-xs font-mono meter bg-paper text-steel border border-line">
            {detectionMethod}
          </span>
        </div>

        {isDetecting && nodeId ? (
          <>
            <div className="bg-panel border border-critical/40 rounded-md p-3">
              <div className="flex items-center justify-between">
                <p className="text-critical text-sm font-display font-semibold uppercase tracking-wide">
                  ▲ Possible HIF Detected
                </p>
                <span className="text-xs font-mono meter text-critical bg-critical-light px-2 py-0.5 rounded border border-critical/20">
                  CRITICAL
                </span>
              </div>

              <p className="text-steel text-xs mt-2">
                Node: <span className="font-mono font-bold text-ink">{nodeId}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-critical/20 text-xs">
                <div>
                  <span className="text-steel">ML Probability: </span>
                  <span className="font-semibold text-critical font-mono meter">
                    {confidence !== null ? `${(confidence * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-steel">Rule Score: </span>
                  <span className="font-semibold text-warning font-mono meter">
                    {ruleScore !== null ? `${ruleScore.toFixed(1)} / 100` : "N/A"}
                  </span>
                </div>
              </div>

              {reasons.length > 0 && (
                <div className="mt-2 text-xs text-warning bg-warning-light p-2 rounded border border-warning/25">
                  <p className="font-display font-semibold uppercase tracking-wide mb-1">Trigger Reasons:</p>
                  <ul className="list-disc list-inside space-y-0.5 font-mono">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-steel text-xs">
              ▲ Safety warning: Manual field verification required. Do NOT approach downed conductors.
            </p>
          </>
        ) : (
          <div className="text-center py-4 bg-nominal-light rounded-md border border-nominal/20">
            <span className="text-nominal text-sm font-display font-semibold uppercase tracking-wide">
              No HIF Detected
            </span>
            <p className="text-steel text-xs mt-1">
              Electrical wave features nominal across all monitored phases.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
