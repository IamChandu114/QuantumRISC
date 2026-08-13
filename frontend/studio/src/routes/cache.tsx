import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import {
  derivedProgramHistory,
  hex,
  timelineSamples,
} from "@/lib/studio/live";

export const Route = createFileRoute("/cache")({
  component: CachePage,
});

function CachePage() {
  const { metrics, waveforms, isConnected, cache } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const cacheSignals = cache?.signals ?? [];
  const history = useMemo(() => derivedProgramHistory(samples, 48), [samples]);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Cache workstation" subtitle="backend cache telemetry from the websocket snapshot stream" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-6">
          <Metric label="Backend" value={isConnected ? "LIVE" : "WAIT"} tone={isConnected ? "good" : "warn"} />
          <Metric label="Cache signals" value={cacheSignals.length.toLocaleString()} tone="signal" />
          <Metric label="Status" value={cache?.available ? "available" : "unavailable"} tone={cache?.available ? "good" : "warn"} />
          <Metric label="Cycles" value={Number(metrics?.cycles ?? 0).toLocaleString()} />
          <Metric label="Retired" value={Number(metrics?.retired ?? 0).toLocaleString()} tone="good" />
          <Metric label="Flushes" value={Number(metrics?.flushes ?? 0).toLocaleString()} tone="fault" />
        </div>
      </Panel>

      <Panel title="L1 telemetry" subtitle="live cache-related signals from the VCD stream" className="xl:col-span-7">
        <div className="space-y-2 p-3">
          {cacheSignals.length > 0 ? (
            cacheSignals.slice(0, 24).map((name: string) => (
              <div key={name} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-2.5">
                <div className="min-w-0">
                <div className="mono-num truncate text-[11px] text-foreground">{name}</div>
                <div className="mono-num text-[10px] text-muted-foreground">current live signal</div>
              </div>
              <div className="mono-num ml-auto rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-signal">
                {signalValue(cache?.current ?? waveforms?.current, name)}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-6 text-[12px] text-muted-foreground">
              {cache?.reason ?? "This backend snapshot does not expose cache-line telemetry for the current session."}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Derived memory behavior" subtitle="backend cycle stream summarized at the system level" className="xl:col-span-5">
        <div className="space-y-3 p-3">
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Backend utilization</span>
              <span className="mono-num normal-case">{cache?.available ? "100.0%" : "0.0%"}</span>
            </div>
            <Bar value={cache?.available ? 1 : 0} tone={cache?.available ? "good" : "warn"} />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Trace window</div>
            <div className="mono-num mt-1 text-[12px] text-foreground">{history.length.toLocaleString()} samples</div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              {history.length ? `latest PC ${hex(history.at(-1)?.pc ?? 0)}` : "waiting for live cycle data"}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Cache line state</div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              {cache?.reason ?? "Tag/index/offset views remain explicitly unavailable until the backend emits cache-line fields."}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Cycle history" subtitle="most recent backend samples" className="xl:col-span-12" bodyClassName="p-0">
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
                  Waiting for backend activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function signalValue(current: Record<string, string> | undefined, name: string): string {
  if (!current) return "—";
  const direct = current[name];
  if (direct !== undefined) return direct;
  const simplified = name.split(".").at(-1) ?? name;
  return current[simplified] ?? "—";
}
