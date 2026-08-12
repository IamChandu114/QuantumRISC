import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel, Sparkline, StatusDot } from "@/components/studio/panel";
import { STAGES } from "@/lib/sim/core";
import { hex, pct } from "@/lib/studio/format";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { state, sim } = useStudio();
  const stallRate = sim.cycle === 0 ? 0 : sim.metrics.stallCycles / sim.cycle;
  const timeline = sim.history.slice(-160);

  const health = [
    { name: "Fetch unit", value: sim.iCache.hitRate, detail: `L1I hit ${pct(sim.iCache.hitRate)}` },
    { name: "Load/store unit", value: sim.dCache.hitRate, detail: `L1D hit ${pct(sim.dCache.hitRate)}` },
    { name: "Branch unit", value: sim.predictor.accuracy, detail: `${sim.predictor.stats.mispredicts} mispredicts` },
    { name: "Issue efficiency", value: 1 - stallRate, detail: `${sim.metrics.stallCycles} stall cycles` },
  ];

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title={`Core 0 — ${state.backendTop || "RV32I scalar"}`}
        subtitle={`${state.frequencyMhz} MHz · in-order · single issue`}
        className="xl:col-span-8"
        actions={<Chip tone={state.running ? "good" : "default"}>{state.running ? "RUNNING" : "HALTED"}</Chip>}
        scroll={false}
      >
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="IPC" value={sim.metrics.ipc.toFixed(3)} tone="signal" hint={`CPI ${sim.metrics.cpi.toFixed(3)}`} />
          <Metric label="Cycles" value={sim.cycle.toLocaleString()} hint={`${(sim.cycle / state.frequencyMhz).toFixed(2)} µs sim`} />
          <Metric label="Retired" value={sim.metrics.retired.toLocaleString()} tone="good" hint="instructions" />
          <Metric label="Stall rate" value={pct(stallRate)} tone={stallRate > 0.3 ? "warn" : "default"} hint={`${sim.metrics.loadUseStalls} load-use`} />
          <Metric label="L1I hit" value={pct(sim.iCache.hitRate)} hint={`${sim.iCache.stats.accesses} accesses`} />
          <Metric label="L1D hit" value={pct(sim.dCache.hitRate)} hint={`${sim.dCache.stats.evictions} evictions`} />
          <Metric label="BP accuracy" value={pct(sim.predictor.accuracy)} tone={sim.predictor.accuracy < 0.7 ? "warn" : "good"} hint={`${sim.metrics.flushes} flushes`} />
          <Metric label="Forwards" value={sim.metrics.forwards.toLocaleString()} tone="signal" hint="bypass activations" />
        </div>
      </Panel>

      <Panel title="Pipeline occupancy" subtitle={`${Math.round(sim.occupancy * 5)} / 5 stages busy`} className="xl:col-span-4">
        <div className="space-y-2.5 p-3">
          {STAGES.map((stage) => {
            const slot = sim.slots[stage];
            const tone = slot.status === "active" ? "good" : slot.status === "stalled" ? "warn" : slot.status === "flushed" ? "fault" : "idle";
            return (
              <div key={stage} className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <StatusDot tone={tone} />
                  <span className="mono-num text-[11px] font-semibold text-foreground">{stage}</span>
                  <span className="mono-num ml-auto truncate text-[11px] text-muted-foreground">
                    {slot.instr?.asm ?? (slot.status === "bubble" ? "· bubble ·" : "—")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Execution timeline"
        subtitle="per-cycle retire / stall / flush trace"
        className="xl:col-span-8"
        actions={
          <div className="flex gap-1.5">
            <Chip tone="good">retire</Chip>
            <Chip tone="warn">stall</Chip>
            <Chip tone="fault">flush</Chip>
          </div>
        }
      >
        <div className="p-3">
          <div className="flex h-24 items-end gap-[2px]">
            {timeline.length === 0 ? (
              <p className="mono-num text-[12px] text-muted-foreground">Press ▶ or step to populate the trace.</p>
            ) : (
              timeline.map((c) => {
                const tone = c.flush ? "bg-fault" : c.stall ? "bg-warn" : c.retired ? "bg-good" : "bg-muted";
                const h = c.flush ? 100 : c.stall ? 55 : c.retired ? 82 : 22;
                return (
                  <div
                    key={c.cycle}
                    className={`min-w-[3px] flex-1 rounded-sm ${tone}`}
                    style={{ height: `${h}%` }}
                    title={`cycle ${c.cycle} · ${c.stages.WB.asm ?? "—"}`}
                  />
                );
              })
            )}
          </div>
          <div className="mono-num mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>cycle {timeline[0]?.cycle ?? 0}</span>
            <span>PC {hex(sim.pc)}</span>
            <span>cycle {sim.cycle}</span>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">IPC trend</div>
            <Sparkline data={sim.ipcSeries} max={1} height={56} />
          </div>
        </div>
      </Panel>

      <Panel title="Subsystem health" subtitle="rolling indicators" className="xl:col-span-4">
        <div className="space-y-3 p-3">
          {health.map((h) => (
            <div key={h.name}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[12px] text-foreground/90">{h.name}</span>
                <span className="mono-num text-[11px] text-muted-foreground">{pct(h.value)}</span>
              </div>
              <Bar value={h.value} tone={h.value > 0.75 ? "good" : h.value > 0.5 ? "warn" : "fault"} />
              <div className="mono-num mt-1 text-[10px] text-muted-foreground">{h.detail}</div>
            </div>
          ))}
          <Link
            to="/pipeline"
            className="mt-1 block rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-center text-[12px] font-medium text-signal transition-colors hover:bg-signal/20"
          >
            Open pipeline viewer →
          </Link>
        </div>
      </Panel>
    </div>
  );
}
