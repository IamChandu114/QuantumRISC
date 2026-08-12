import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import { hex, pct } from "@/lib/studio/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/branch")({
  component: BranchPage,
});

const COUNTER_LABEL = ["SN", "WN", "WT", "ST"];
const COUNTER_TONE = ["bg-fault/70", "bg-warn/60", "bg-good/45", "bg-good/80"];

function BranchPage() {
  const { sim } = useStudio();
  const p = sim.predictor;
  const events = [...p.events].reverse();

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Gshare predictor" subtitle={`${p.historyBits}-bit GHR · ${p.table.length}-entry PHT · 2-bit saturating`} className="xl:col-span-7">
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Accuracy" value={pct(p.accuracy)} tone={p.accuracy > 0.85 ? "good" : "warn"} />
            <Metric label="Predictions" value={p.stats.predictions.toLocaleString()} />
            <Metric label="Mispredicts" value={p.stats.mispredicts.toLocaleString()} tone="fault" />
            <Metric label="Recovery" value={p.stats.recoveryCycles.toLocaleString()} unit="cy" tone="warn" hint="2 cycles / flush" />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Global history register</span>
              <span className="mono-num normal-case tracking-normal text-signal">
                {p.globalHistory.toString(2).padStart(p.historyBits, "0")}
              </span>
            </div>
            <div className="flex gap-1">
              {p.globalHistory
                .toString(2)
                .padStart(p.historyBits, "0")
                .split("")
                .map((bit, i) => (
                  <span
                    key={i}
                    className={cn(
                      "mono-num grid h-7 flex-1 place-items-center rounded border text-[11px]",
                      bit === "1" ? "border-good/50 bg-good/15 text-good" : "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {bit}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Pattern history table (64 × 2-bit counters)
            </div>
            <div className="grid grid-cols-16 gap-1">
              {Array.from(p.table).map((c, i) => (
                <div
                  key={i}
                  title={`index ${i} · ${COUNTER_LABEL[c]}`}
                  className={cn("h-5 rounded-[3px]", COUNTER_TONE[c])}
                />
              ))}
            </div>
            <div className="mono-num mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {COUNTER_LABEL.map((l, i) => (
                <span key={l} className="flex items-center gap-1">
                  <span className={cn("size-2 rounded-[2px]", COUNTER_TONE[i])} /> {l}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Prediction accuracy</span>
              <span className="mono-num normal-case tracking-normal">{pct(p.accuracy, 2)}</span>
            </div>
            <Bar value={p.accuracy} tone={p.accuracy > 0.85 ? "good" : "warn"} />
          </div>
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-5">
        <Panel title="Branch target buffer" subtitle={`${p.btb.size} resident entries`} bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Branch PC</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Direction</th>
              </tr>
            </thead>
            <tbody>
              {[...p.btb.entries()].map(([pc, target]) => (
                <tr key={pc} className="border-t border-border/50">
                  <td className="mono-num px-3 py-1.5 text-[11px]">{hex(pc)}</td>
                  <td className="mono-num px-3 py-1.5 text-[11px] text-signal">{hex(target)}</td>
                  <td className="px-3 py-1.5">
                    <Chip tone={target < pc ? "violet" : "default"}>{target < pc ? "backward" : "forward"}</Chip>
                  </td>
                </tr>
              ))}
              {p.btb.size === 0 && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">BTB cold.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Resolution log" subtitle="most recent branch outcomes" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">PC</th>
                <th className="px-3 py-2 font-medium">Pred</th>
                <th className="px-3 py-2 font-medium">Actual</th>
                <th className="px-3 py-2 font-medium">Counter</th>
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 14).map((e, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="mono-num px-3 py-1.5 text-[11px]">{hex(e.pc, 4)}</td>
                  <td className="mono-num px-3 py-1.5 text-[11px] text-muted-foreground">{e.predictedTaken ? "T" : "N"}</td>
                  <td className="mono-num px-3 py-1.5 text-[11px]">{e.taken ? "T" : "N"}</td>
                  <td className="mono-num px-3 py-1.5 text-[11px] text-muted-foreground">
                    {COUNTER_LABEL[e.counterBefore]} → {COUNTER_LABEL[e.counterAfter]}
                  </td>
                  <td className="px-3 py-1.5">
                    <Chip tone={e.correct ? "good" : "fault"}>{e.correct ? "HIT" : "FLUSH"}</Chip>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-[12px] text-muted-foreground">No branches resolved yet.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
