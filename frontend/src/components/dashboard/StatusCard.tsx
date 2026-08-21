import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "nominal" | "warning" | "critical" | "offline" | "neutral";
  icon?: string;
}

export default function StatusCard({
  title,
  value,
  subtitle,
  status = "neutral",
  icon,
}: StatusCardProps) {
  const valueColor = {
    nominal: "text-emerald-400",
    warning: "text-amber-400",
    critical: "text-red-400",
    offline: "text-slate-500",
    neutral: "text-slate-100",
  }[status];

  const borderColor = {
    nominal: "border-emerald-500/20",
    warning: "border-amber-500/20",
    critical: "border-red-500/20",
    offline: "border-slate-700",
    neutral: "border-slate-700/60",
  }[status];

  return (
    <div
      className={cn(
        "bg-slate-800/60 border rounded-xl p-4 flex flex-col gap-1",
        borderColor,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={cn("text-2xl font-bold font-mono", valueColor)}>
        {value}
      </div>
      {subtitle && (
        <div className="text-slate-500 text-xs mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
