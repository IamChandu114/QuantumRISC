import { useStudio } from "@/hooks/use-studio";
import { StatusDot } from "./panel";

function pct(value: number, decimals: number): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function hex(value: number): string {
  return `0x${value.toString(16).padStart(8, "0")}`;
}

function backendTone(status: string): "good" | "warn" | "fault" | "idle" {
  if (status === "running" || status === "compiled" || status === "paused") return "good";
  if (status === "connecting" || status === "compiling") return "warn";
  if (status === "disconnected" || status === "fault") return "fault";
  return "idle";
}

function backendLabel(status: string, sessionId: string | null): string {
  if ((status === "running" || status === "compiled") && sessionId) return `backend · ${sessionId.substring(0, 8)}`;
  if (status === "connecting") return "backend · connecting...";
  if (status === "disconnected") return "backend · disconnected";
  if (status === "fault") return "backend · fault";
  return `backend · ${status}`;
}

/** Bottom instrumentation strip: always-visible core telemetry + backend status. */
export function StatusBar() {
  const { status, sessionId, isConnected, playback, metrics, architecture, top } = useStudio();

  const cycle = playback?.cycle || 0;
  const pc = architecture?.pc || 0;
  const retired = metrics?.retired || 0;
  const ipc = metrics?.ipc || 0;
  const cpi = metrics?.cpi || 0;
  const stalls = metrics?.stalls || metrics?.stallCycles || 0;
  const stallRate = cycle === 0 ? 0 : stalls / cycle;
  const hazards = metrics?.hazards || 0;
  const forwards = metrics?.forwards || 0;

  const items: Array<[string, string]> = [
    ["PC", hex(pc)],
    ["CYCLE", cycle.toLocaleString()],
    ["RETIRED", retired.toLocaleString()],
    ["IPC", ipc.toFixed(3)],
    ["CPI", cpi.toFixed(3)],
    ["STALL", pct(stallRate, 1)],
    ["HZD", hazards.toLocaleString()],
    ["FWD", forwards.toLocaleString()],
  ];

  return (
    <footer className="z-20 flex h-7 shrink-0 items-center gap-4 overflow-x-auto border-t border-border bg-surface/80 px-3 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-1.5">
        <StatusDot tone={status === "running" ? "good" : "idle"} />
        <span className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
          {status === "running" ? "running" : "halted"}
        </span>
      </div>
      {items.map(([label, value]) => (
        <div key={label} className="mono-num flex shrink-0 items-center gap-1.5 text-[10px]">
          <span className="uppercase tracking-wider text-muted-foreground/70">{label}</span>
          <span className="text-foreground/90">{value}</span>
        </div>
      ))}
      <div className="mono-num ml-auto flex shrink-0 items-center gap-1.5 text-[10px]">
        <StatusDot tone={backendTone(status)} />
        <span className="text-muted-foreground/70">{backendLabel(status, sessionId)}</span>
      </div>
      <div className="mono-num shrink-0 text-[10px] uppercase text-muted-foreground/50">
        {top ? `${top} · live hardware` : "rv32i · backend snapshot"}
      </div>
    </footer>
  );
}
