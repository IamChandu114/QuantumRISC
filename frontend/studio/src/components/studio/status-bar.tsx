import { useStudio } from "@/hooks/use-studio";
import { hex, pct } from "@/lib/studio/format";
import { StatusDot } from "./panel";
import type { BackendStatus } from "@/lib/studio/backend-bridge";

function backendTone(status: BackendStatus): "good" | "warn" | "fault" | "idle" {
  if (status === "connected") return "good";
  if (status === "connecting") return "warn";
  if (status === "offline") return "fault";
  return "idle";
}

function backendLabel(status: BackendStatus, sessionId: string | null): string {
  if (status === "connected" && sessionId) return `backend · ${sessionId}`;
  if (status === "connected") return "backend · online";
  if (status === "connecting") return "backend · connecting…";
  if (status === "offline") return "backend · offline";
  return "backend · disabled";
}

/** Bottom instrumentation strip: always-visible core telemetry + backend status. */
export function StatusBar() {
  const { state, sim } = useStudio();
  const wallClockUs = state.frequencyMhz > 0 ? sim.cycle / state.frequencyMhz : 0;
  const stallRate = sim.cycle === 0 ? 0 : sim.metrics.stallCycles / sim.cycle;

  const items: Array<[string, string]> = [
    ["PC", hex(sim.pc)],
    ["CYCLE", sim.cycle.toLocaleString()],
    ["RETIRED", sim.metrics.retired.toLocaleString()],
    ["IPC", sim.metrics.ipc.toFixed(3)],
    ["CPI", sim.metrics.cpi.toFixed(3)],
    ["STALL", pct(stallRate, 1)],
    ["L1D", pct(sim.dCache.hitRate, 1)],
    ["BP", pct(sim.predictor.accuracy, 1)],
    ["SIM-T", `${wallClockUs.toFixed(2)} µs`],
  ];

  return (
    <footer className="z-20 flex h-7 shrink-0 items-center gap-4 overflow-x-auto border-t border-border bg-surface/80 px-3 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-1.5">
        <StatusDot tone={state.running ? "good" : "idle"} />
        <span className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
          {state.running ? "running" : "halted"}
        </span>
      </div>
      {items.map(([label, value]) => (
        <div key={label} className="mono-num flex shrink-0 items-center gap-1.5 text-[10px]">
          <span className="uppercase tracking-wider text-muted-foreground/70">{label}</span>
          <span className="text-foreground/90">{value}</span>
        </div>
      ))}
      {/* Backend connection status */}
      <div className="mono-num ml-auto flex shrink-0 items-center gap-1.5 text-[10px]">
        <StatusDot tone={backendTone(state.backendStatus)} />
        <span className="text-muted-foreground/70">
          {backendLabel(state.backendStatus, state.backendSessionId)}
        </span>
      </div>
      <div className="mono-num shrink-0 text-[10px] text-muted-foreground/50 uppercase">
        {state.backendTop ? `${state.backendTop} · live hardware` : "rv32i · built-in model"}
      </div>
    </footer>
  );
}
