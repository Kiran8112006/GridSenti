export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-steel">
      <div className="w-8 h-8 border-2 border-line border-t-signal rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
