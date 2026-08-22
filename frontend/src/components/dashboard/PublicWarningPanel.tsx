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
    <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>⚠️</span> Public Hazard Warning Simulation
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800 font-bold">
            PROTOTYPE SIMULATION
          </span>
        </div>

        {!activeWarning && (
          <button
            onClick={handleSimulateWarning}
            disabled={isSimulating}
            className="px-3 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
          >
            {isSimulating ? "Broadcasting..." : "[ SIMULATE WARNING ]"}
          </button>
        )}
      </div>

      {activeWarning ? (
        <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              ACTIVE SIMULATED HAZARD WARNING
            </span>
            <span className="text-slate-400 text-[11px]">
              Generated: {timeAgo(activeWarning.timestamp)}
            </span>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm">{activeWarning.title}</h4>
            <p className="text-amber-200 text-xs mt-1 leading-relaxed">
              &quot;{activeWarning.message}&quot;
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 flex-wrap gap-2">
            <span className="text-slate-400 text-[11px]">
              Location: <strong className="text-cyan-300">{activeWarning.location}</strong>
            </span>

            <button
              onClick={() => handleResolveWarning(activeWarning.warningId)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all"
            >
              [ RESOLVE WARNING ]
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 text-center text-slate-500 text-xs">
          ✓ No active public hazard warnings. Grid operating under nominal parameters.
        </div>
      )}
    </section>
  );
}
