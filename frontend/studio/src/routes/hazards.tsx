import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Metric, Panel } from "@/components/studio/panel";
import {
  asNumber,
  derivedProgramHistory,
  hex,
  historyWindow,
  pct,
  sortRecent,
  timelineSamples,
} from "@/lib/studio/live";
import { REG_NAMES } from "@/lib/sim/isa";

export const Route = createFileRoute("/hazards")({
  component: HazardsPage,
});

const KIND_TONE: Record<string, "good" | "warn" | "fault" | "violet" | "default"> = {
  RAW: "good",
  "RAW-forward": "good",
  "RAW-stall": "warn",
  WAR: "default",
  WAW: "default",
  structural: "violet",
  control: "fault",
};

function HazardsPage() {
  const { hazards, forwarding, metrics, playback, waveforms, isConnected } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => historyWindow(derivedProgramHistory(samples, 96), 24), [samples]);
  const recentHazards = useMemo(() => sortRecent((hazards ?? []) as any[]).slice(0, 24), [hazards]);
  const cycle = asNumber(playback?.cursor ?? metrics?.cycles, 0);

  const counts = useMemo(() => {
    const tally: Record<"RAW" | "WAR" | "WAW" | "structural" | "control", number> = { RAW: 0, WAR: 0, WAW: 0, structural: 0, control: 0 };
    for (const hazard of hazards ?? []) {
      const key = String(hazard.kind ?? hazard.type ?? "RAW") as keyof typeof tally;
      tally[key] = (tally[key] ?? 0) + 1;
    }
    return tally;
  }, [hazards]);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Hazard summary" subtitle="backend analyzers and derived dependency counts" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="RAW" value={counts["RAW"].toLocaleString()} tone="good" />
          <Metric label="WAR" value={counts["WAR"].toLocaleString()} />
          <Metric label="WAW" value={counts["WAW"].toLocaleString()} />
          <Metric label="Structural" value={counts["structural"].toLocaleString()} tone="signal" />
          <Metric label="Control" value={counts["control"].toLocaleString()} tone="fault" />
          <Metric label="Forwarding" value={forwarding.length.toLocaleString()} tone="signal" />
        </div>
        <div className="border-t border-border/70 p-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="good">RAW forward</Chip>
            <Chip tone="warn">RAW stall</Chip>
            <Chip tone="fault">control flush</Chip>
            <Chip tone="violet">structural</Chip>
            <Chip>WAR / WAW impossible in-order</Chip>
          </div>
        </div>
      </Panel>

      <Panel title="Dependency log" subtitle="most recent backend hazard events" className="xl:col-span-7" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Producer → Consumer</th>
              <th className="px-3 py-2 font-medium">Reg</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {recentHazards.map((hazard: any, index: number) => (
              <tr key={`${hazard.cycle ?? index}-${index}`} className="border-t border-border/50 align-top">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{hazard.cycle ?? cycle}</td>
                <td className="px-3 py-2">
                  <Chip tone={KIND_TONE[hazard.kind ?? hazard.type ?? "RAW"] || "default"}>{String(hazard.kind ?? hazard.type ?? "RAW")}</Chip>
                </td>
                <td className="px-3 py-2">
                  <div className="mono-num text-[11px] text-foreground/90">
                    {hazard.producer_pc ? hex(hazard.producer_pc) : "producer"} → {hazard.consumer_pc ? hex(hazard.consumer_pc) : "consumer"}
                  </div>
                  <div className="mono-num text-[10px] text-muted-foreground">
                    {hazard.path ?? "backend analyzer"} · {hazard.resolution ?? hazard.resolved ?? "live dependency"}
                  </div>
                </td>
                <td className="mono-num px-3 py-2 text-[11px]">
                  {hazard.register != null || hazard.producer_rd != null
                    ? `x${hazard.register ?? hazard.producer_rd} (${REG_NAMES[hazard.register ?? hazard.producer_rd]})`
                    : "—"}
                </td>
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{hazard.penalty != null ? `${hazard.penalty} cy` : "backend-derived"}</td>
              </tr>
            ))}
            {recentHazards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No hazards detected in the current backend snapshot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Forwarding paths" subtitle="operand bypass visibility" className="xl:col-span-5">
        <div className="space-y-2 p-3">
          {forwarding.length > 0 ? (
            forwarding.slice(0, 8).map((item: any, index: number) => (
              <div key={`${item.from}-${item.to}-${index}`} className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
                <div className="flex items-center gap-2">
                  <Chip tone="signal">{item.path ?? `${item.from} → ${item.to}`}</Chip>
                  <span className="mono-num text-[11px] text-muted-foreground">{item.reason ?? "RAW"}</span>
                </div>
                <div className="mono-num mt-1 text-[11px] text-foreground/90">
                  {item.producer_pc ? hex(item.producer_pc) : "producer"} → {item.consumer_pc ? hex(item.consumer_pc) : "consumer"}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-6 text-[12px] text-muted-foreground">
              Forwarding data has not been emitted yet.
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Cycle timeline" subtitle="recent backend samples and hazard markers" className="xl:col-span-12" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">PC</th>
              <th className="px-3 py-2 font-medium">Instruction</th>
              <th className="px-3 py-2 font-medium">Markers</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(-12).reverse().map((sample) => (
              <tr key={`${sample.cycle}-${sample.pc}`} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{sample.cycle}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(sample.pc)}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground/90">{hex(sample.instr)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {recentHazards.length > 0 ? <Chip tone="warn">dependency</Chip> : <Chip tone={isConnected ? "good" : "default"}>{isConnected ? "live" : "waiting"}</Chip>}
                  </div>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Waiting for backend cycle data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
