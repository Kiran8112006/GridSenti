"use client";

import { useState } from "react";
import type { PublicWarning } from "@/types";
import { simulatePublicWarning, resolvePublicWarning } from "@/services/publicWarning.service";
import { timeAgo } from "@/utils";

interface PublicWarningPanelProps {
  warnings: PublicWarning[];
  activeNodeId?: string;
  onRefresh?: () => void;
}

export default function PublicWarningPanel({
  warnings,
  activeNodeId = "GS-NODE-001",
  onRefresh,
}: PublicWarningPanelProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const activeWarning = warnings.find((w) => w.status === "ACTIVE") || null;

  const handleSimulateWarning = async () => {
    setIsSimulating(true);
    try {
      await simulatePublicWarning(activeNodeId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Failed to simulate public warning:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResolveWarning = async (warningId: string) => {
    try {
      await resolvePublicWarning(warningId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Failed to resolve public warning:", err);
    }
  };

  return (
    <section className="bg-panel border border-line rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-line pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-warning">▲</span> Public Hazard Warning Simulation
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-warning-light text-warning border border-warning/20 font-bold">
            PROTOTYPE SIMULATION
          </span>
        </div>

        {!activeWarning && (
          <button
            onClick={handleSimulateWarning}
            disabled={isSimulating}
            className="px-3 py-1 rounded bg-warning-light hover:bg-warning/20 text-warning border border-warning/40 text-[11px] font-display font-bold uppercase tracking-wide transition-colors"
          >
            {isSimulating ? "Broadcasting..." : "[ Simulate Warning ]"}
          </button>
        )}
      </div>

      {activeWarning ? (
        <div className="bg-warning-light border border-warning/40 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wide bg-critical-light text-critical border border-critical/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-critical" />
              Active Simulated Hazard Warning
            </span>
            <span className="text-steel text-[11px]">
              Generated: {timeAgo(activeWarning.timestamp)}
            </span>
          </div>

          <div>
            <h4 className="text-ink font-bold text-sm">{activeWarning.title}</h4>
            <p className="text-warning text-xs mt-1 leading-relaxed">
              &quot;{activeWarning.message}&quot;
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-warning/25 flex-wrap gap-2">
            <span className="text-steel text-[11px]">
              Location: <strong className="text-signal">{activeWarning.location}</strong>
            </span>

            <button
              onClick={() => handleResolveWarning(activeWarning.warningId)}
              className="px-3 py-1 rounded bg-panel hover:bg-nominal-light text-nominal border border-nominal/40 text-[11px] font-display font-bold uppercase tracking-wide transition-colors"
            >
              [ Resolve Warning ]
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-lg p-4 text-center text-steel-light text-xs">
          ✓ No active public hazard warnings. Grid operating under nominal parameters.
        </div>
      )}
    </section>
  );
}
