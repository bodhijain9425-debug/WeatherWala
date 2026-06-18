import { CloudSun } from 'lucide-react';

export function Header() {
  return (
    <div className="glass-panel pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-monsoon/15 text-monsoon">
        <CloudSun size={18} strokeWidth={2} />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold tracking-tight text-ink sm:text-base">
          WeatherWala
        </p>
        <p className="hidden text-[11px] text-mist sm:block">Live conditions across India</p>
      </div>
      <span className="ml-1 hidden items-center gap-1.5 self-start rounded-full border border-panel-border px-2 py-0.5 text-[10px] font-medium text-mist sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-monsoon" />
        Live
      </span>
    </div>
  );
}
