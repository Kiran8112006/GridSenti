import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
      <span className="text-3xl text-warning">▲</span>
      <div className="flex items-center gap-3">
        <span className="meter text-3xl font-mono font-bold text-ink bg-panel border border-line rounded-md px-3 py-1">
          404
        </span>
        <span className="text-steel text-sm font-display uppercase tracking-wide">
          Route Not Registered
        </span>
      </div>
      <p className="text-steel text-sm max-w-sm">
        This page doesn&apos;t exist on the grid. Check the URL, or head back
        to the operations center.
      </p>
      <Link
        href="/"
        className="mt-2 px-4 py-2 rounded-md text-sm font-display font-semibold uppercase tracking-wide bg-signal text-white hover:bg-signal/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
