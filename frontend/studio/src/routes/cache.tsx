import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import type { Cache } from "@/lib/sim/cache";
import { hex, pct } from "@/lib/studio/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cache")({
  component: CachePage,
});

function CacheView({ cache, tone }: { cache: Cache; tone: "signal" | "violet" }) {
  const { config, stats } = cache;
  return (
    <Panel
      title={`${config.name} — ${config.sizeBytes / 1024} KiB, ${config.ways}-way`}
      subtitle={`${cache.sets} sets · ${config.lineBytes} B lines · ${config.policy.toUpperCase()} · ${config.missPenalty}-cycle penalty`}
      actions={<Chip tone={cache.hitRate > 0.85 ? "good" : cache.hitRate > 0.6 ? "warn" : "fault"}>{pct(cache.hitRate)}</Chip>}
    >
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Accesses" value={stats.accesses.toLocaleString()} />
          <Metric label="Hits" value={stats.hits.toLocaleString()} tone="good" />
          <Metric label="Misses" value={stats.misses.toLocaleString()} tone="warn" />
          <Metric label="Evictions" value={stats.evictions.toLocaleString()} tone="fault" hint={`${stats.writeBacks} write-backs`} />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>Hit rate</span>
            <span className="mono-num normal-case tracking-normal">{pct(cache.hitRate, 2)}</span>
          </div>
          <Bar value={cache.hitRate} tone={cache.hitRate > 0.85 ? "good" : "warn"} />
        </div>

        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Recent access stream</div>
          <div className="flex h-8 items-end gap-[2px]">
            {cache.recent.length === 0 ? (
              <span className="mono-num text-[11px] text-muted-foreground">idle</span>
            ) : (
              cache.recent.map((r, i) => (
                <span
                  key={i}
                  title={`${hex(r.addr)} · ${r.hit ? "hit" : "miss"}`}
                  className={cn("min-w-[3px] flex-1 rounded-sm", r.hit ? "h-3 bg-good" : "h-8 bg-fault")}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Set / way occupancy</div>
          <div className="grid grid-cols-8 gap-1 sm:grid-cols-12 lg:grid-cols-16">
            {cache.lines.map((set, setIndex) => (
              <div key={setIndex} className="space-y-[2px]" title={`set ${setIndex}`}>
                {set.map((line, way) => (
                  <div
                    key={way}
                    className={cn(
                      "h-2 rounded-[2px] border",
                      !line.valid
                        ? "border-border bg-muted/30"
                        : line.dirty
                          ? "border-warn/50 bg-warn/50"
                          : tone === "signal"
                            ? "border-signal/50 bg-signal/50"
                            : "border-violet-signal/50 bg-violet-signal/50",
                    )}
                    title={`set ${setIndex} way ${way} · ${line.valid ? `tag ${hex(line.tag, 4)}${line.dirty ? " (dirty)" : ""}` : "invalid"}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mono-num mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-[2px] bg-muted/60" /> invalid</span>
            <span className="flex items-center gap-1"><span className={cn("size-2 rounded-[2px]", tone === "signal" ? "bg-signal/60" : "bg-violet-signal/60")} /> clean</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-[2px] bg-warn/60" /> dirty</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function CachePage() {
  const { sim } = useStudio();
  const amat =
    sim.dCache.stats.accesses === 0
      ? 1
      : 1 + (1 - sim.dCache.hitRate) * sim.dCache.config.missPenalty;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-2">
      <CacheView cache={sim.iCache} tone="signal" />
      <CacheView cache={sim.dCache} tone="violet" />
      <Panel title="Memory hierarchy analysis" subtitle="derived metrics" className="xl:col-span-2" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric label="AMAT (L1D)" value={amat.toFixed(2)} unit="cy" tone="signal" hint="1 + miss_rate × penalty" />
          <Metric label="Memory stalls" value={sim.metrics.memoryStallCycles.toLocaleString()} unit="cy" tone="warn" />
          <Metric label="MPKI (L1D)" value={(sim.metrics.retired === 0 ? 0 : (sim.dCache.stats.misses / sim.metrics.retired) * 1000).toFixed(1)} hint="misses / 1K instr" />
          <Metric label="Write-back traffic" value={`${(sim.dCache.stats.writeBacks * sim.dCache.config.lineBytes) / 1024} KiB`} />
          <Metric label="I-fetch bandwidth" value={`${(sim.iCache.stats.accesses * 4 / 1024).toFixed(1)} KiB`} />
        </div>
      </Panel>
    </div>
  );
}
