"use client";

import { useState } from "react";

interface SimulateIsolationModalProps {
  isOpen: boolean;
  nodeId: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function SimulateIsolationModal({
  isOpen,
  nodeId,
  onClose,
  onConfirm,
}: SimulateIsolationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono animate-fadeIn">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 pb-3">
          <span className="w-9 h-9 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center text-lg shrink-0">
            🔌
          </span>
          <div>
            <h3 className="text-white font-bold text-base tracking-tight">
              Simulate Feeder Isolation
            </h3>
            <span className="text-amber-400 text-[10px] uppercase tracking-wider block font-semibold">
              SOFTWARE SIMULATION ONLY
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 text-xs text-slate-300">
          <p className="leading-relaxed">
            Are you sure you want to simulate section isolation for{" "}
            <strong className="text-cyan-300 font-bold">{nodeId}</strong>?
          </p>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <span className="text-red-400 font-bold block uppercase text-[10px]">
              ⚠️ Prototype Safety Notice:
            </span>
            <p>
              This action will mark the feeder section as <strong className="text-red-400">ISOLATED (SIMULATION)</strong> in software. No physical relay hardware, mains electricity, or high-voltage circuits will be triggered.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            {isSubmitting ? "Simulating..." : "Simulate Isolation"}
          </button>
        </div>
      </div>
    </div>
  );
}
