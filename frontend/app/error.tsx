"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
      <span className="text-3xl text-critical">◆</span>
      <div className="flex items-center gap-3">
        <span className="meter text-3xl font-mono font-bold text-ink bg-panel border border-line rounded-md px-3 py-1">
          500
        </span>
        <span className="text-steel text-sm font-display uppercase tracking-wide">
          Application Fault
        </span>
      </div>
      <p className="text-steel text-sm max-w-sm">
        Something went wrong rendering this screen.
        {error.message && (
          <>
            {" "}
            <span className="font-mono meter text-critical">
              {error.message}
            </span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 px-4 py-2 rounded-md text-sm font-display font-semibold uppercase tracking-wide bg-signal text-white hover:bg-signal/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
