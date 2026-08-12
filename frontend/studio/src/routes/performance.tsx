import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Metric, Panel, Sparkline } from "@/components/studio/panel";
import { pct } from "@/lib/studio/format";

export const Route = createFileRoute("/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  const { state, sim } = useStudio();
  const m = sim.metrics;
  const cycles = Math.max(1, sim.cycle);
  const retired = Math.max(1, m.retired);

  const stack = [
    { name: "Useful issue", cycles: Math.max(0, m.retired), tone: "good" as const },
    { name: "Load-use interlock", cycles: m.loadUseStalls, tone: "warn" as const },
    { name: "Memory refill", cycles: m.memoryStallCycles, tone: "warn" as const },
    { name: "Branch recovery", cycles: sim.predictor.stats.recoveryCycles, tone: "fault" as const },
    { name: "Fill / drain", cycles: Math.max(0, cycles - m.retired - m.loadUseStalls - m.memoryStallCycles - sim.predictor.stats.recoveryCycles), tone: "signal" as const },
  ];

  const ipcCeiling = 1;
  const efficiency = m.ipc / ipcCeiling;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Throughput" subtitle={`${state.frequencyMhz} MHz · scalar in-order`} className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="IPC" value={m.ipc.toFixed(3)} tone="signal" hint={`ceiling ${ipcCeiling.toFixed(2)}`} />
          <Metric label="CPI" value={m.cpi.toFixed(3)} hint="cycles / instruction" />
          <Metric label="MIPS" value={(m.ipc * state.frequencyMhz).toFixed(0)} hint="at current clock" />
          <Metric label="Pipeline efficiency" value={pct(efficiency)} tone={efficiency > 0.7 ? "good" : "warn"} />
          <Metric label="Stall cycles" value={m.stallCycles.toLocaleString()} tone="warn" />
          <Metric label="Flush cycles" value={sim.predictor.stats.recoveryCycles.toLocaleString()} tone="fault" />
        </div>
      </Panel>

      <Panel title="IPC trend" subtitle="sampled every 8 cycles" className="xl:col-span-7">
        <div className="p-3">
          <Sparkline data={sim.ipcSeries} max={1} height={140} />
          <div className="mono-num mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>0.00</span>
            <span>current {m.ipc.toFixed(3)}</span>
            <span>1.00 ceiling</span>
          </div>
        </div>
      </Panel>

      <Panel title="CPI stack" subtitle="cycle accounting by cause" className="xl:col-span-5">
        <div className="space-y-2.5 p-3">
          {stack.map((s) => (
            <div key={s.name}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[12px] text-foreground/90">{s.name}</span>
                <span className="mono-num text-[11px] text-muted-foreground">
                  {(s.cycles / retired).toFixed(3)} CPI · {s.cycles.toLocaleString()} cy
                </span>
              </div>
              <Bar value={s.cycles / cycles} tone={s.tone} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Bottleneck attribution" subtitle="where cycles are lost" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Data cache",
              body: `L1D hit rate ${pct(sim.dCache.hitRate)} across ${sim.dCache.stats.accesses.toLocaleString()} accesses. Each miss costs ${sim.dCache.config.missPenalty} cycles of blocking refill; a non-blocking MSHR would hide most of it.`,
            },
            {
              title: "Branch prediction",
              body: `Gshare accuracy ${pct(sim.predictor.accuracy)} with ${sim.predictor.stats.mispredicts} mispredicts, costing ${sim.predictor.stats.recoveryCycles} recovery cycles. Resolving direction in ID would halve the penalty.`,
            },
            {
              title: "Dependency stalls",
              body: `${m.loadUseStalls} load-use interlocks against ${m.forwards.toLocaleString()} successful bypasses. Scheduling an independent instruction into the load shadow removes these entirely.`,
            },
            {
              title: "Front end",
              body: `L1I hit rate ${pct(sim.iCache.hitRate)}. The fetch unit keeps ${Math.round(sim.occupancy * 5)}/5 stages populated this cycle; deeper fetch buffering would smooth refill bubbles.`,
            },
          ].map((c) => (
            <article key={c.title} className="rounded-lg border border-border/70 bg-surface-raised/30 p-3">
              <h3 className="text-[12px] font-semibold text-signal">{c.title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
