import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel, Sparkline, StatusDot } from "@/components/studio/panel";
import {
  asNumber,
  currentCycle,
  currentStatusLabel,
  derivedProgramHistory,
  hex,
  pct,
  timelineSamples,
} from "@/lib/studio/live";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { status, sessionId, top, testbench, isConnected, playback, metrics, architecture, waveforms, compile, run, transportState } =
    useStudio();

  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => derivedProgramHistory(samples, 160), [samples]);

  const cycle = currentCycle(playback, metrics);
  const retired = asNumber(metrics?.retired, 0);
  const stalls = asNumber(metrics?.stalls ?? metrics?.stallCycles, 0);
  const flushes = asNumber(metrics?.flushes, 0);
  const forwards = asNumber(metrics?.forwards, 0);
  const ipc = asNumber(metrics?.ipc, 0);
  const cpi = asNumber(metrics?.cpi, 0);
  const backendState = currentStatusLabel(status, isConnected, transportState);
  const stallRate = cycle > 0 ? stalls / cycle : 0;

  const quickFacts = [
    { label: "IPC", value: ipc.toFixed(3), tone: "signal" as const, hint: `CPI ${cpi.toFixed(3)}` },
    { label: "Cycles", value: cycle.toLocaleString(), hint: history.length ? `${history.length} live samples` : "waiting for backend samples" },
    { label: "Retired", value: retired.toLocaleString(), tone: "good" as const, hint: "live backend total" },
    { label: "Stall rate", value: pct(stallRate, 1), tone: stallRate > 0.2 ? "warn" as const : "default" as const, hint: `${stalls} stall cycles` },
    { label: "Forwards", value: forwards.toLocaleString(), tone: "signal" as const, hint: "bypass activations" },
    { label: "Flushes", value: flushes.toLocaleString(), tone: "fault" as const, hint: "control recovery" },
  ];

  const current = history.at(-1);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title={`QuantumRISC Studio ${sessionId ? `· ${sessionId.slice(0, 8)}` : ""}`}
        subtitle={`${backendState} · ${top || "no active top"} · ${testbench || "no testbench"}`}
        className="xl:col-span-8"
        actions={<Chip tone={isConnected ? "good" : "warn"}>{isConnected ? "CONNECTED" : "WAITING"}</Chip>}
        scroll={false}
      >
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickFacts.map((item) => (
            <Metric key={item.label} label={item.label} value={item.value} tone={item.tone ?? "default"} hint={item.hint} />
          ))}
        </div>
        <div className="grid gap-2.5 border-t border-border/70 p-3 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-border/70 bg-surface-raised/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Execution trend</div>
                <div className="mono-num text-[11px] text-muted-foreground">
                  {history.length ? `${history.length} backend timeline samples` : "waiting for compilation"}
                </div>
              </div>
              <StatusDot tone={isConnected ? "good" : "idle"} />
            </div>
            <Sparkline data={history.map((sample) => sample.cycle)} max={Math.max(1, ...history.map((sample) => sample.cycle))} height={72} />
            <div className="mono-num mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>PC {hex(architecture?.pc ?? 0)}</span>
              <span>Cycle {cycle.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-surface-raised/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Current instruction</div>
            <div className="mono-num mt-1 break-all text-[12px] text-foreground">
              {current ? hex(current.instr) : "waiting for backend snapshot"}
            </div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              {current ? `PC ${hex(current.pc)} · cycle ${current.cycle}` : "No live instruction yet."}
            </div>
            <div className="mt-3 space-y-1.5">
              <Link to="/pipeline" className="block rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-center text-[12px] font-medium text-signal transition-colors hover:bg-signal/20">
                Open pipeline workstation
              </Link>
              <Link to="/waveforms" className="block rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-center text-[12px] text-muted-foreground transition-colors hover:border-signal/30 hover:text-foreground">
                Inspect waveforms
              </Link>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Session status" subtitle="backend handshake and runtime control" className="xl:col-span-4" scroll={false}>
        <div className="space-y-2.5 p-3">
          <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Connection</div>
            <div className="mono-num mt-1 text-[12px] text-foreground">{backendState}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Compile" value={compile?.ok === true ? "PASS" : compile?.ok === false ? "FAIL" : "PENDING"} tone={compile?.ok ? "good" : compile?.ok === false ? "fault" : "warn"} />
            <Metric label="Run" value={run?.ok === true ? "PASS" : run?.ok === false ? "FAIL" : "PENDING"} tone={run?.ok ? "good" : run?.ok === false ? "fault" : "warn"} />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Topology</div>
            <div className="mono-num mt-1 text-[12px] text-foreground">{top || "No live top module selected"}</div>
            <div className="mono-num text-[11px] text-muted-foreground">{testbench || "No active testbench"}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Backend state</div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              {transportState === "connected"
                ? "Live snapshots arriving over WebSocket."
                : transportState === "reconnecting"
                  ? "Reconnecting to the Railway backend."
                  : transportState === "backend-unavailable"
                    ? "Backend unavailable. Retrying automatically."
                    : transportState === "websocket-failed"
                      ? "WebSocket failed. Retrying automatically."
                      : "Connecting to the Railway backend."}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Live timeline" subtitle="most recent backend cycles" className="xl:col-span-8" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">PC</th>
              <th className="px-3 py-2 font-medium">Instruction</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(-12).reverse().map((sample) => (
              <tr key={`${sample.cycle}-${sample.pc}`} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{sample.cycle}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(sample.pc)}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground/90">{hex(sample.instr)}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Waiting for compilation and live waveform data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Backend metrics" subtitle="authoritative counters from the FastAPI snapshot" className="xl:col-span-4">
        <div className="grid grid-cols-2 gap-2.5 p-3">
          <Metric label="IPC" value={ipc.toFixed(3)} tone="signal" />
          <Metric label="CPI" value={cpi.toFixed(3)} />
          <Metric label="Cycles" value={asNumber(metrics?.cycles, 0).toLocaleString()} />
          <Metric label="Retired" value={retired.toLocaleString()} tone="good" />
          <Metric label="Hazards" value={asNumber(metrics?.hazards, 0).toLocaleString()} tone="warn" />
          <Metric label="Forwards" value={forwards.toLocaleString()} tone="signal" />
        </div>
      </Panel>
    </div>
  );
}
