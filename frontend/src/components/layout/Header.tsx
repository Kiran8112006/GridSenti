"use client";

import { APP_CONFIG } from "@/config/app.config";

export default function Header() {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700/60 flex items-center px-6 gap-4 shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">
          GS
        </div>
        <div>
          <span className="text-white font-semibold text-base tracking-tight">
            {APP_CONFIG.name}
          </span>
          <span className="text-slate-400 text-xs ml-2 hidden sm:inline">
            Grid Safety Monitor
          </span>
        </div>
      </div>

      {/* Prototype badge */}
      <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 select-none">
        PROTOTYPE · SIMULATED DATA
      </span>

      <div className="flex-1" />

      {/* System clock */}
      <SystemClock />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>LIVE</span>
      </div>
    </header>
  );
}

function SystemClock() {
  // NOTE: Using static text for SSR safety. 
  // A later phase can hydrate with a client-side clock.
  return (
    <span className="text-slate-400 text-xs font-mono hidden md:block">
      {new Date().toUTCString().replace("GMT", "UTC")}
    </span>
  );
}
