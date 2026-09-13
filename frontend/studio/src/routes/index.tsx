import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Chip, Metric, Panel, StatusDot } from "@/components/studio/panel";
import { useStudio } from "@/hooks/use-studio";
import { asNumber, currentCycle, currentStatusLabel, hex, pct, timelineSamples } from "@/lib/studio/live";

export const Route = createFileRoute("/")({ component: DashboardPage });
type EventKind = "RETIRE" | "STALL" | "FLUSH";

function signalValue(source: Record<string, unknown> | undefined, suffix: string): unknown {
  const key = source && Object.keys(source).find((name) => name.endsWith(suffix));
  return key ? source?.[key] : undefined;
}
function instruction(value: unknown): string { return value === undefined || value === null || value === "" ? "—" : hex(value); }
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
  const retired = asNumber(metrics?.retired, 0), stalls = asNumber(metrics?.stalls ?? metrics?.stallCycles, 0), flushes = asNumber(metrics?.flushes, 0), forwards = asNumber(metrics?.forwards, 0), ipc = asNumber(metrics?.ipc, 0), cpi = asNumber(metrics?.cpi, 0);
  const stallRate = cycle > 0 ? stalls / cycle : 0;
  const backendState = currentStatusLabel(status, isConnected, transportState);
  const currentSignals = (waveforms?.current ?? cache?.current ?? {}) as Record<string, unknown>;
  const timeline = useMemo(() => samples.map((sample: any) => ({ cycle: asNumber(sample?.time, 0), kind: eventForSample(sample) })).filter((event): event is { cycle: number; kind: EventKind } => event.kind !== null), [samples]);
  const stages = [
    ["IF", signalValue(currentSignals, "IF_ID.instruction_in [31:0]"), "sampled"],
    ["ID", signalValue(currentSignals, "IF_ID.instruction_out [31:0]"), "sampled"],
    ["EX", pipeline?.instruction, "snapshot"],
    ["MEM", undefined, "not exposed"],
    ["WB", pipeline?.writeback_data, "snapshot"],
  ] as const;
  const metricCards = [
    { label: "IPC", value: metrics?.ipc == null ? "N/A" : ipc.toFixed(3), tone: "signal" as const, hint: "backend counter" },
    { label: "CPI", value: metrics?.cpi == null ? "N/A" : cpi.toFixed(3), hint: "backend counter" },
    { label: "Cycles", value: metrics?.cycles == null ? "N/A" : cycle.toLocaleString(), hint: "simulation cycles" },
    { label: "Retired", value: metrics?.retired == null ? "N/A" : retired.toLocaleString(), tone: "good" as const, hint: "backend counter" },
    { label: "Stall rate", value: metrics?.stalls == null && metrics?.stallCycles == null ? "N/A" : pct(stallRate, 1), tone: "warn" as const, hint: metrics?.stalls == null && metrics?.stallCycles == null ? "not available" : `${stalls} stall cycles` },
    { label: "L1I hit", value: "N/A", hint: "not available from backend" },
    { label: "L1D hit", value: "N/A", hint: "not available from backend" },
    { label: "BP accuracy", value: "N/A", hint: "not available from backend" },
  ];
  const compileValue = compile?.ok === true ? "PASS" : compile?.ok === false ? "FAIL" : "PENDING";
  const runValue = run?.ok === true ? "PASS" : run?.ok === false ? "FAIL" : "PENDING";

  return <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
    <Panel title="Core 0 — RV32I scalar" subtitle={`${top || "waiting for top module"} · ${testbench || "waiting for testbench"}`} className="xl:col-span-8" scroll={false} actions={<Chip tone={isConnected ? "good" : "warn"}>{isConnected ? "CONNECTED" : "WAITING"}</Chip>}>
      <div className="border-b border-border/70 px-3 py-2 mono-num text-[11px] text-muted-foreground">in-order · single issue · frequency unavailable</div>
      <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4">{metricCards.map((metric) => <Metric key={metric.label} {...metric} />)}</div>
    </Panel>
    <Panel title="Pipeline occupancy" subtitle="current live backend snapshot" className="xl:col-span-4" scroll={false}><div className="divide-y divide-border/60 px-3">{stages.map(([name, value, state]) => <div key={name} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 py-2.5"><span className="mono-num text-[11px] font-semibold text-signal">{name}</span><span className="mono-num truncate text-[11px] text-foreground">{instruction(value)}</span><span className="mono-num text-[9px] uppercase text-muted-foreground">{value === undefined ? "not exposed" : state}</span></div>)}</div></Panel>
    <Panel title="Execution timeline" subtitle={samples.length ? `${samples.length} real waveform samples` : "waiting for backend waveform data"} className="xl:col-span-8" scroll={false}><div className="p-3">{timeline.length ? <div className="flex min-h-20 items-end gap-px overflow-hidden rounded-md border border-border/60 bg-background/35 p-2">{timeline.map((event, index) => <div key={`${event.cycle}-${index}`} title={`${event.kind} · cycle ${event.cycle}`} className={`min-w-1 flex-1 rounded-sm ${event.kind === "RETIRE" ? "bg-good" : event.kind === "STALL" ? "bg-warn" : "bg-fault"}`} style={{ height: event.kind === "RETIRE" ? "42%" : event.kind === "STALL" ? "70%" : "100%" }} />)}</div> : <div className="grid min-h-20 place-items-center rounded-md border border-dashed border-border/70 text-[11px] text-muted-foreground">No classified retire, stall, or flush events reported.</div>}<div className="mono-num mt-2 flex gap-4 text-[10px] text-muted-foreground"><span className="text-good">■ RETIRE</span><span className="text-warn">■ STALL</span><span className="text-fault">■ FLUSH</span><span className="ml-auto">cycle {cycle}</span></div></div></Panel>
    <Panel title="Subsystem health" subtitle="only metrics exposed by the active backend" className="xl:col-span-4" scroll={false}><div className="space-y-2.5 p-3"><Health label="Fetch unit" value="N/A" detail="no fetch health metric" /><Health label="Load/store unit" value="N/A" detail="no load/store health metric" /><Health label="Branch unit" value="N/A" detail="no branch accuracy metric" /><Health label="Issue efficiency" value={metrics?.ipc == null ? "N/A" : `${ipc.toFixed(3)} IPC`} detail={metrics?.ipc == null ? "not available" : "backend IPC"} signal /><div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2"><Metric label="Compile" value={compileValue} tone={compileValue === "PASS" ? "good" : compileValue === "FAIL" ? "fault" : "warn"} /><Metric label="Run" value={runValue} tone={runValue === "PASS" ? "good" : runValue === "FAIL" ? "fault" : "warn"} /></div></div></Panel>
    <Panel title="IPC trend" subtitle="historical IPC samples" className="xl:col-span-8" scroll={false}><div className="grid min-h-28 place-items-center p-3 text-[11px] text-muted-foreground">Waiting for historical IPC samples.</div></Panel>
    <Panel title="Runtime" subtitle="live session state" className="xl:col-span-4" scroll={false}><div className="space-y-2 p-3 mono-num text-[11px]"><div className="flex items-center gap-2"><StatusDot tone={isConnected ? "good" : "warn"} /><span className="text-foreground">{backendState}</span></div><div className="text-muted-foreground">Forwards <span className="text-signal">{metrics?.forwards == null ? "N/A" : forwards}</span> · Flushes <span className="text-fault">{metrics?.flushes == null ? "N/A" : flushes}</span></div><div className="text-muted-foreground">Session {sessionId ? sessionId.slice(0, 8) : "waiting"}</div></div></Panel>
  </div>;
}

function Health({ label, value, detail, signal = false }: { label: string; value: string; detail: string; signal?: boolean }) { return <div className="flex items-center justify-between border-b border-border/50 pb-2"><div><div className="text-[11px] text-foreground">{label}</div><div className="mono-num text-[10px] text-muted-foreground">{detail}</div></div><span className={signal ? "mono-num text-[11px] text-signal" : "mono-num text-[11px] text-muted-foreground"}>{value}</span></div>; }
