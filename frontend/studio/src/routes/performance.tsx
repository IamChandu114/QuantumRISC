import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Metric, Panel, Sparkline } from "@/components/studio/panel";
import { asNumber, derivedProgramHistory, pct, timelineSamples } from "@/lib/studio/live";

export const Route = createFileRoute("/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  const { metrics, hazards, waveforms, playback, isConnected } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => derivedProgramHistory(samples, 180), [samples]);

  const cycles = Math.max(1, asNumber(metrics?.cycles, 0));
  const retired = Math.max(1, asNumber(metrics?.retired, 0));
  const ipc = asNumber(metrics?.ipc, 0);
  const cpi = asNumber(metrics?.cpi, 0);
  const stalls = asNumber(metrics?.stalls ?? metrics?.stallCycles, 0);
  const forwards = asNumber(metrics?.forwards, 0);
  const flushes = asNumber(metrics?.flushes, 0);
  const stallRate = stalls / cycles;

  const cpiStack = [
    { name: "Useful issue", cycles: retired, tone: "good" as const },
    { name: "Stalls", cycles: stalls, tone: "warn" as const },
    { name: "Flushes", cycles: flushes, tone: "fault" as const },
    { name: "Forwarding", cycles: forwards, tone: "signal" as const },
    { name: "Fill / drain", cycles: Math.max(0, cycles - retired - stalls - flushes), tone: "default" as const },
  ];

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Performance center" subtitle="authoritative backend counters and timeline-derived throughput" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="IPC" value={ipc.toFixed(3)} tone="signal" />
          <Metric label="CPI" value={cpi.toFixed(3)} />
          <Metric label="Cycles" value={cycles.toLocaleString()} />
          <Metric label="Retired" value={retired.toLocaleString()} tone="good" />
          <Metric label="Stalls" value={stalls.toLocaleString()} tone="warn" />
          <Metric label="Flushes" value={flushes.toLocaleString()} tone="fault" />
        </div>
      </Panel>

      <Panel title="Throughput" subtitle={isConnected ? "live backend stream" : "waiting for backend connection"} className="xl:col-span-7">
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Pipeline efficiency" value={pct(Math.max(0, 1 - stallRate))} tone={stallRate < 0.2 ? "good" : "warn"} />
            <Metric label="Forwarding" value={forwards.toLocaleString()} tone="signal" />
            <Metric label="Hazards" value={asNumber(metrics?.hazards, hazards.length).toLocaleString()} tone="warn" />
            <Metric label="Observed cycles" value={history.length.toLocaleString()} />
          </div>
          <Sparkline data={history.map((sample) => sample.cycle)} max={Math.max(1, ...history.map((sample) => sample.cycle))} height={140} />
          <div className="mono-num flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span>timeline-derived throughput</span>
            <span>{cycles.toLocaleString()}</span>
          </div>
        </div>
      </Panel>

      <Panel title="CPI stack" subtitle="cycle accounting from the backend counters" className="xl:col-span-5">
        <div className="space-y-2.5 p-3">
          {cpiStack.map((entry) => (
            <div key={entry.name}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[12px] text-foreground/90">{entry.name}</span>
                <span className="mono-num text-[11px] text-muted-foreground">
                  {(entry.cycles / retired).toFixed(3)} CPI · {entry.cycles.toLocaleString()} cy
                </span>
              </div>
              <Bar value={entry.cycles / cycles} tone={entry.tone === "default" ? "signal" : entry.tone} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Backend analytics" subtitle="what the current snapshot can and cannot quantify" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <h3 className="text-[12px] font-semibold text-signal">Execution rate</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              IPC {ipc.toFixed(3)} and CPI {cpi.toFixed(3)} are direct backend measurements from the current simulation stream.
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <h3 className="text-[12px] font-semibold text-signal">Pipeline pressure</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              {stalls.toLocaleString()} stall cycles and {flushes.toLocaleString()} flush cycles are visible in the authoritative metrics payload.
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <h3 className="text-[12px] font-semibold text-signal">Hazard load</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              {asNumber(metrics?.hazards, hazards.length).toLocaleString()} hazards were observed by the backend analyzers for this run.
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <h3 className="text-[12px] font-semibold text-signal">Pending telemetry</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              Branch prediction accuracy and cache-specific performance are not emitted by the current backend snapshot, so this workstation keeps them explicitly unavailable rather than fabricating numbers.
            </p>
          </article>
        </div>
      </Panel>
    </div>
  );
}
