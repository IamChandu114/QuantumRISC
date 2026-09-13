import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Chip, Metric, Panel, StatusDot } from "@/components/studio/panel";
import { useStudio } from "@/hooks/use-studio";
import { asNumber, currentCycle, currentStatusLabel, hex, pct, timelineSamples } from "@/lib/studio/live";

export const Route = createFileRoute("/")({ component: DashboardPage });
type EventKind = "RETIRE" | "STALL" | "FLUSH";
type TimelinePoint = { cycle: number; kind: EventKind | null; changes: number };

function signalValue(source: Record<string, unknown> | undefined, suffix: string): unknown {
  const key = source && Object.keys(source).find((name) => name.endsWith(suffix));
  return key ? source?.[key] : undefined;
}
function instruction(value: unknown): string { return value === undefined || value === null || value === "" ? "-" : hex(value); }
function eventForSample(sample: any): EventKind | null {
  const changed = sample?.changed as Record<string, unknown> | undefined;
  if (!changed) return null;
  if (asNumber(signalValue(changed, "IF_ID.flush"), 0) !== 0) return "FLUSH";
  if (asNumber(signalValue(changed, "IF_ID.enable"), 1) === 0) return "STALL";
  return asNumber(signalValue(changed, "RF.we"), 0) !== 0 ? "RETIRE" : null;
}

function DashboardPage() {
  const { status, sessionId, top, testbench, isConnected, playback, metrics, pipeline, waveforms, cache, compile, run, transportState } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const cycle = asNumber(metrics?.cycles, 0) || currentCycle(playback, metrics);
  const retired = asNumber(metrics?.retired, 0);
  const stalls = asNumber(metrics?.stalls ?? metrics?.stallCycles, 0);
  const flushes = asNumber(metrics?.flushes, 0);
  const forwards = asNumber(metrics?.forwards, 0);
  const ipc = asNumber(metrics?.ipc, 0);
  const cpi = asNumber(metrics?.cpi, 0);
  const backendState = currentStatusLabel(status, isConnected, transportState);
  const currentSignals = (waveforms?.current ?? cache?.current ?? {}) as Record<string, unknown>;
  const timeline = useMemo<TimelinePoint[]>(() => samples.map((sample: any) => {
    const changed = sample?.changed as Record<string, unknown> | undefined;
    return { cycle: asNumber(sample?.time, 0), kind: eventForSample(sample), changes: changed ? Object.keys(changed).length : 0 };
  }), [samples]);
  const stages = [["IF", signalValue(currentSignals, "IF_ID.instruction_in [31:0]"), "SAMPLED"], ["ID", signalValue(currentSignals, "IF_ID.instruction_out [31:0]"), "SAMPLED"], ["EX", pipeline?.instruction, "SNAPSHOT"], ["MEM", undefined, "NOT EXPOSED"], ["WB", pipeline?.writeback_data, "SNAPSHOT"]] as const;
  const metricCards = [
    { label: "IPC", value: metrics?.ipc == null ? "N/A" : ipc.toFixed(3), tone: "signal" as const, hint: "backend counter" },
    { label: "CPI", value: metrics?.cpi == null ? "N/A" : cpi.toFixed(3), hint: "backend counter" },
    { label: "Cycles", value: metrics?.cycles == null ? "N/A" : cycle.toLocaleString(), hint: "simulation cycles" },
    { label: "Retired", value: metrics?.retired == null ? "N/A" : retired.toLocaleString(), tone: "good" as const, hint: "backend counter" },
    { label: "Stall rate", value: metrics?.stalls == null && metrics?.stallCycles == null ? "N/A" : pct(cycle > 0 ? stalls / cycle : 0, 1), tone: "warn" as const, hint: metrics?.stalls == null && metrics?.stallCycles == null ? "not available from backend" : `${stalls} stall cycles` },
    { label: "L1I hit", value: "N/A", hint: "not available from backend" }, { label: "L1D hit", value: "N/A", hint: "not available from backend" }, { label: "BP accuracy", value: "N/A", hint: "not available from backend" },
  ];
  const compileValue = compile?.ok === true ? "PASS" : compile?.ok === false ? "FAIL" : "PENDING";
  const runValue = run?.ok === true ? "PASS" : run?.ok === false ? "FAIL" : "PENDING";

  return <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
    <Panel title="Core 0 - RV32I scalar" subtitle={`${top || "waiting for top module"} / ${testbench || "waiting for testbench"}`} className="xl:col-span-8" scroll={false} actions={<Chip tone={isConnected ? "good" : "warn"}>{isConnected ? "CONNECTED" : "WAITING"}</Chip>}>
      <div className="border-b border-border/70 px-3 py-1.5 mono-num text-[10px] text-muted-foreground">in-order / single issue / frequency unavailable</div>
      <div className="grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-4">{metricCards.map((metric) => <Metric key={metric.label} {...metric} />)}</div>
    </Panel>
    <Panel title="Pipeline occupancy" subtitle="current live backend snapshot" className="xl:col-span-4" scroll={false}><div className="divide-y divide-border/60 px-3">{stages.map(([name, value, state]) => <div key={name} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 py-2"><span className="mono-num text-[11px] font-semibold text-signal">{name}</span><span className="mono-num truncate text-[11px] text-foreground">{instruction(value)}</span><span className="mono-num text-[9px] uppercase text-muted-foreground">{value === undefined ? "NOT EXPOSED" : state}</span></div>)}</div></Panel>
    <Panel title="Execution timeline" subtitle={samples.length ? `${samples.length} real VCD samples` : "waiting for backend waveform data"} className="xl:col-span-8" scroll={false}><div className="p-2.5">{timeline.length ? <div className="overflow-x-auto rounded-md border border-border/60 bg-background/35 p-2"><div className="flex h-20 min-w-max items-end gap-px">{timeline.map((point, index) => <div key={`${point.cycle}-${index}`} title={`sample ${index + 1}; VCD time ${point.cycle}; ${point.changes} changed signals${point.kind ? `; ${point.kind}` : ""}`} className={`w-3 shrink-0 border-t-2 ${point.kind === "RETIRE" ? "border-good bg-good/35" : point.kind === "STALL" ? "border-warn bg-warn/35" : point.kind === "FLUSH" ? "border-fault bg-fault/35" : "border-muted-foreground/40 bg-muted/40"}`} style={{ height: `${Math.max(12, Math.min(100, point.changes))}%` }} />)}</div></div> : <div className="grid min-h-20 place-items-center rounded-md border border-dashed border-border/70 text-[11px] text-muted-foreground">No waveform loaded.</div>}<div className="mono-num mt-2 flex gap-3 text-[10px] text-muted-foreground"><span className="text-good">RETIRE</span><span className="text-warn">STALL</span><span className="text-fault">FLUSH</span><span>gray: unclassified signal change</span><span className="ml-auto">cycle {cycle}</span></div></div></Panel>
    <Panel title="Subsystem health" subtitle="only current backend telemetry" className="xl:col-span-4" scroll={false}><div className="space-y-2 p-2.5"><Health label="Fetch unit" value="N/A" detail="no fetch health metric" /><Health label="Load/store unit" value="N/A" detail="no load/store health metric" /><Health label="Branch unit" value="N/A" detail="no branch accuracy metric" /><Health label="Issue efficiency" value={metrics?.ipc == null ? "N/A" : `${ipc.toFixed(3)} IPC`} detail={metrics?.ipc == null ? "not available" : "backend IPC"} signal /><div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2"><Metric label="Compile" value={compileValue} tone={compileValue === "PASS" ? "good" : compileValue === "FAIL" ? "fault" : "warn"} /><Metric label="Run" value={runValue} tone={runValue === "PASS" ? "good" : runValue === "FAIL" ? "fault" : "warn"} /></div></div></Panel>
    <Panel title="IPC trend" subtitle="historical IPC samples" className="xl:col-span-8" scroll={false}><div className="grid min-h-24 place-items-center p-2.5 text-[11px] text-muted-foreground">Waiting for historical IPC samples.</div></Panel>
    <Panel title="Runtime" subtitle="live session state" className="xl:col-span-4" scroll={false}><div className="space-y-2 p-2.5 mono-num text-[11px]"><div className="flex items-center gap-2"><StatusDot tone={isConnected ? "good" : "warn"} /><span className="text-foreground">{backendState}</span></div><div className="text-muted-foreground">Forwards <span className="text-signal">{metrics?.forwards == null ? "N/A" : forwards}</span> / Flushes <span className="text-fault">{metrics?.flushes == null ? "N/A" : flushes}</span></div><div className="text-muted-foreground">Session {sessionId ? sessionId.slice(0, 8) : "waiting"}</div></div></Panel>
  </div>;
}

function Health({ label, value, detail, signal = false }: { label: string; value: string; detail: string; signal?: boolean }) { return <div className="flex items-center justify-between border-b border-border/50 pb-1.5"><div><div className="text-[11px] text-foreground">{label}</div><div className="mono-num text-[10px] text-muted-foreground">{detail}</div></div><span className={signal ? "mono-num text-[11px] text-signal" : "mono-num text-[11px] text-muted-foreground"}>{value}</span></div>; }
