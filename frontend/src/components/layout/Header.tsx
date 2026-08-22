"use client";

import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/config/app.config";

export default function Header() {
  return (
    <header className="h-14 bg-panel border-b border-line flex items-center px-6 gap-4 shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-signal ring-1 ring-inset ring-black/10 flex items-center justify-center text-white font-display font-bold text-sm tracking-tight select-none">
          GS
        </div>
        <div>
          <span className="text-ink font-display font-semibold text-base tracking-wide uppercase">
            {APP_CONFIG.name}
          </span>
          <span className="text-steel text-xs ml-2 hidden sm:inline">
            Grid Safety Monitor
          </span>
        </div>
      </div>

      {/* Prototype badge — styled after hazard-tape signage */}
      <span className="ml-3 pl-2.5 pr-2 py-0.5 border-l-4 border-warning bg-warning-light text-warning text-xs font-display font-semibold uppercase tracking-wide select-none">
        Prototype · Simulated Data
      </span>

      <div className="flex-1" />

      {/* System clock */}
      <SystemClock />
    </header>
  );
}

function SystemClock() {
  // Renders nothing until mounted, then ticks every second — avoids the
  // server/client hydration mismatch that a render-time `new Date()` causes.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="text-steel text-xs font-mono meter hidden md:block">
      {now ? now.toUTCString().replace("GMT", "UTC") : ""}
    </span>
  );
}
