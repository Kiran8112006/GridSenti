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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 font-mono">
      <div className="bg-panel border-2 border-critical/60 rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <span className="w-9 h-9 rounded-full bg-critical-light text-critical border border-critical/30 flex items-center justify-center text-lg shrink-0">
            ⚙
          </span>
          <div>
            <h3 className="text-ink font-display font-bold text-base uppercase tracking-wide">
              Simulate Feeder Isolation
            </h3>
            <span className="text-warning text-[10px] uppercase tracking-wider block font-display font-semibold">
              Software Simulation Only
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 text-xs text-steel">
          <p className="leading-relaxed">
            Are you sure you want to simulate section isolation for{" "}
            <strong className="text-signal font-bold">{nodeId}</strong>?
          </p>

          <div className="bg-paper p-3 rounded-md border border-line text-[11px] text-steel space-y-1">
            <span className="text-critical font-display font-bold block uppercase text-[10px]">
              ▲ Prototype Safety Notice:
            </span>
            <p>
              This action will mark the feeder section as <strong className="text-critical">ISOLATED (SIMULATION)</strong> in software. No physical relay hardware, mains electricity, or high-voltage circuits will be triggered.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-paper hover:bg-line text-steel text-xs font-display font-semibold uppercase tracking-wide transition-colors border border-line"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-critical hover:bg-critical/90 text-white text-xs font-display font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
          >
            {isSubmitting ? "Simulating..." : "Simulate Isolation"}
          </button>
        </div>
      </div>
    </div>
  );
}
