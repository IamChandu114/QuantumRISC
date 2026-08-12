import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { STAGES } from "@/lib/sim/core";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/waveforms")({
  component: WaveformsPage,
});

const ZOOMS = [4, 8, 14, 22] as const;

function WaveformsPage() {
  const { sim } = useStudio();
  const [zoom, setZoom] = useState<number>(8);
  const [cursor, setCursor] = useState<number | null>(null);

  const window = sim.history.slice(-Math.floor(1200 / zoom));

  const signals: Array<{ group: string; name: string; value: (c: (typeof window)[number]) => boolean; tone: string }> = [
    ...STAGES.map((s) => ({
      group: "pipeline",
      name: `${s.toLowerCase()}_valid`,
      value: (c: (typeof window)[number]) => c.stages[s].status === "active",
      tone: "bg-signal",
    })),
    { group: "control", name: "stall", value: (c) => c.stall, tone: "bg-warn" },
    { group: "control", name: "flush", value: (c) => c.flush, tone: "bg-fault" },
    { group: "control", name: "br_resolve", value: (c) => c.branchResolved, tone: "bg-violet-signal" },
    { group: "memory", name: "l1i_hit", value: (c) => c.iCacheHit === true, tone: "bg-good" },
    { group: "memory", name: "l1d_hit", value: (c) => c.dCacheHit === true, tone: "bg-good" },
    { group: "commit", name: "retire", value: (c) => c.retired, tone: "bg-good" },
  ];

  const groups = [...new Set(signals.map((s) => s.group))];
  const cursorRecord = cursor === null ? null : window.find((c) => c.cycle === cursor) ?? null;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3">
      <Panel
        title="Timing diagram"
        subtitle={`${window.length} cycles in view · click a column to place the cursor`}
        actions={
          <div className="flex items-center gap-1" role="group" aria-label="Zoom">
            {ZOOMS.map((z) => (
              <button
                key={z}
                type="button"
                aria-pressed={zoom === z}
                onClick={() => setZoom(z)}
                className={cn(
                  "mono-num rounded-md border px-2 py-1 text-[10px]",
                  zoom === z ? "border-signal/50 bg-signal/15 text-signal" : "border-border text-muted-foreground",
                )}
              >
                {z}px
              </button>
            ))}
          </div>
        }
      >
        <div className="p-3">
          {window.length === 0 ? (
            <p className="mono-num text-[12px] text-muted-foreground">Run the core to capture waveform data.</p>
          ) : (
            <div className="min-w-full">
              {groups.map((group) => (
                <div key={group} className="mb-3">
                  <div className="mb-1 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">{group}</div>
                  {signals
                    .filter((s) => s.group === group)
                    .map((sig) => (
                      <div key={sig.name} className="flex items-center gap-3 py-[3px]">
                        <span className="mono-num w-[92px] shrink-0 truncate text-[10.5px] text-foreground/80">
                          {sig.name}
                        </span>
                        <div className="flex h-5 flex-1 items-stretch gap-px overflow-hidden rounded border border-border/60 bg-background/60">
                          {window.map((c) => {
                            const high = sig.value(c);
                            return (
                              <button
                                key={c.cycle}
                                type="button"
                                aria-label={`cycle ${c.cycle} ${sig.name} ${high ? "high" : "low"}`}
                                onClick={() => setCursor(c.cycle)}
                                style={{ width: zoom }}
                                className={cn(
                                  "shrink-0",
                                  high ? sig.tone : "bg-transparent",
                                  high ? "opacity-90" : "opacity-100",
                                  cursor === c.cycle && "outline outline-1 outline-signal",
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
              <div className="mono-num mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>t = {window[0]?.cycle}</span>
                <span>t = {window[window.length - 1]?.cycle}</span>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Cursor measurement" subtitle={cursorRecord ? `cycle ${cursorRecord.cycle}` : "no cursor placed"} scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-6">
          {cursorRecord ? (
            <>
              {STAGES.map((s) => (
                <div key={s} className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{s}</div>
                  <div className="mono-num truncate text-[11.5px]">{cursorRecord.stages[s].asm ?? "—"}</div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                {cursorRecord.stall && <Chip tone="warn">stall</Chip>}
                {cursorRecord.flush && <Chip tone="fault">flush</Chip>}
                {cursorRecord.retired && <Chip tone="good">retire</Chip>}
                {!cursorRecord.stall && !cursorRecord.flush && !cursorRecord.retired && <Chip>nominal</Chip>}
              </div>
            </>
          ) : (
            <p className="col-span-full text-[12px] text-muted-foreground">
              Click any waveform column to inspect that cycle.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
