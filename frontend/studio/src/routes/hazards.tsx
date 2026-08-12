import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Metric, Panel } from "@/components/studio/panel";
import type { HazardKind } from "@/lib/sim/core";
import { REG_NAMES } from "@/lib/sim/isa";

export const Route = createFileRoute("/hazards")({
  component: HazardsPage,
});

const KIND_TONE: Record<HazardKind, "good" | "warn" | "fault" | "violet" | "default"> = {
  "RAW-forward": "good",
  "RAW-stall": "warn",
  WAR: "default",
  WAW: "default",
  structural: "violet",
  control: "fault",
};

const TAXONOMY: Array<{ kind: string; title: string; body: string }> = [
  {
    kind: "RAW",
    title: "Read-after-write (true dependency)",
    body: "Consumer reads a register the producer has not committed. Resolved by EX/MEM or MEM/WB bypass; a load in EX forces a one-cycle interlock because the value only exists after MEM.",
  },
  {
    kind: "WAR",
    title: "Write-after-read (anti-dependency)",
    body: "Structurally impossible in this design: operands are read in ID and written in WB, so a younger write can never overtake an older read in an in-order pipeline.",
  },
  {
    kind: "WAW",
    title: "Write-after-write (output dependency)",
    body: "Also impossible here: a single write port commits in program order from WB. It appears once instructions retire out of order (scoreboard / Tomasulo).",
  },
  {
    kind: "Structural",
    title: "Resource conflict",
    body: "Split L1I/L1D removes the classic fetch-vs-memory conflict. Remaining structural pressure comes from a blocking D-cache holding MEM during a refill.",
  },
  {
    kind: "Control",
    title: "Branch / control hazard",
    body: "Direction is resolved in EX, so a mispredict squashes the two younger instructions and redirects fetch — a fixed 2-cycle recovery.",
  },
];

function HazardsPage() {
  const { sim } = useStudio();

  const counts = useMemo(() => {
    const c: Record<string, number> = { "RAW-forward": 0, "RAW-stall": 0, control: 0, structural: 0 };
    for (const h of sim.hazards) c[h.kind] = (c[h.kind] ?? 0) + 1;
    return c;
  }, [sim.hazards, sim.cycle]);

  const recent = [...sim.hazards].reverse().slice(0, 24);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Hazard summary" subtitle="cumulative detections" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="RAW bypassed" value={sim.metrics.forwards.toLocaleString()} tone="good" hint="zero-cost" />
          <Metric label="Load-use stalls" value={sim.metrics.loadUseStalls.toLocaleString()} tone="warn" hint="1 cycle each" />
          <Metric label="Control flushes" value={sim.metrics.flushes.toLocaleString()} tone="fault" hint="2 cycles each" />
          <Metric label="Memory stalls" value={sim.metrics.memoryStallCycles.toLocaleString()} tone="warn" hint="L1D refill" />
          <Metric label="WAR / WAW" value="0" hint="impossible in-order" />
          <Metric label="Bubble cycles" value={sim.metrics.bubbleCycles.toLocaleString()} hint={`${counts["RAW-stall"] ?? 0} interlocks`} />
        </div>
      </Panel>

      <Panel title="Dependency log" subtitle="most recent hazard events" className="xl:col-span-7" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cy</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Producer → Consumer</th>
              <th className="px-3 py-2 font-medium">Reg</th>
              <th className="px-3 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((h, i) => (
              <tr key={`${h.cycle}-${i}`} className="border-t border-border/50 align-top">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{h.cycle}</td>
                <td className="px-3 py-2"><Chip tone={KIND_TONE[h.kind]}>{h.kind}</Chip></td>
                <td className="px-3 py-2">
                  <div className="mono-num text-[11px] text-foreground/90">{h.producer} → {h.consumer}</div>
                  <div className="mono-num text-[10px] text-muted-foreground">{h.path} · {h.resolution}</div>
                </td>
                <td className="mono-num px-3 py-2 text-[11px]">{h.register >= 0 ? `x${h.register} (${REG_NAMES[h.register]})` : "—"}</td>
                <td className="mono-num px-3 py-2 text-[11px]">{h.penalty} cy</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-[12px] text-muted-foreground">No hazards detected yet.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Hazard taxonomy" subtitle="why each class does or does not occur here" className="xl:col-span-5">
        <div className="space-y-2 p-3">
          {TAXONOMY.map((t) => (
            <article key={t.kind} className="rounded-lg border border-border/70 bg-surface-raised/30 p-3">
              <div className="flex items-center gap-2">
                <Chip tone="signal">{t.kind}</Chip>
                <h3 className="text-[12px] font-medium text-foreground/90">{t.title}</h3>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{t.body}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
