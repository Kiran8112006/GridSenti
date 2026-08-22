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
    nominal: "text-nominal",
    warning: "text-warning",
    critical: "text-critical",
    offline: "text-offline",
    neutral: "text-ink",
  }[status];

  const accentBar = {
    nominal: "bg-nominal",
    warning: "bg-warning",
    critical: "bg-critical",
    offline: "bg-offline",
    neutral: "bg-line-strong",
  }[status];

  return (
    <div className="relative bg-panel border border-line rounded-lg pl-4 pr-3 py-3 flex flex-col gap-2 overflow-hidden">
      <span className={cn("absolute left-0 top-0 bottom-0 w-1", accentBar)} />
      <div className="flex items-center justify-between">
        <span className="text-steel text-xs font-display font-medium uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <span className={cn("text-sm leading-none", valueColor)}>
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "meter text-2xl font-bold font-mono bg-paper border border-line rounded-md px-2.5 py-1.5 w-fit",
          valueColor,
        )}
      >
        {value}
      </div>
      {subtitle && <div className="text-steel-light text-xs">{subtitle}</div>}
    </div>
  );
}
