import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import { asNumber, derivedProgramHistory, hex, timelineSamples } from "@/lib/studio/live";

export const Route = createFileRoute("/branch")({
  component: BranchPage,
});

function BranchPage() {
  const { hazards, metrics, waveforms, branch } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => derivedProgramHistory(samples, 120), [samples]);
  const controlHazards = (hazards as any[]).filter((hazard: any) => String(hazard.kind ?? hazard.type ?? "").toLowerCase().includes("control"));
  const branchSignals = branch?.signals ?? [];
  const branchAvailable = Boolean(branch?.available ?? branchSignals.length > 0);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Control-flow recovery" subtitle="backend hazards and live branch recovery signals" className="xl:col-span-7">
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Status" value={branchAvailable ? "available" : "unavailable"} tone={branchAvailable ? "good" : "warn"} />
            <Metric label="Flushes" value={asNumber(metrics?.flushes, 0).toLocaleString()} tone="fault" />
            <Metric label="Cycles" value={asNumber(metrics?.cycles, 0).toLocaleString()} />
            <Metric label="Control hazards" value={controlHazards.length.toLocaleString()} tone="warn" />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Branch signals</span>
              <span className="mono-num normal-case tracking-normal text-signal">{branchSignals.length.toLocaleString()}</span>
            </div>
            <div className="space-y-1.5">
              {branchSignals.slice(0, 8).map((name: string) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-2">
                  <div className="mono-num truncate text-[11px] text-foreground">{name}</div>
                  <div className="mono-num ml-auto rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-signal">
                    {signalValue(branch?.current ?? waveforms?.current, name)}
                  </div>
                </div>
              ))}
              {branchSignals.length === 0 && (
                <div className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-4 text-[12px] text-muted-foreground">
                  {branch?.reason ?? "The current backend snapshot does not emit dedicated branch predictor signals."}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictor state</div>
            <div className="grid grid-cols-4 gap-1">
              {LABELS.map((label, index) => (
                <div key={label} className="rounded-md border border-border/70 bg-surface-raised/35 px-2 py-2 text-center">
                  <div className="mono-num text-[10px] text-muted-foreground">{label}</div>
                  <div className="mono-num mt-1 text-[11px] text-foreground">{branchAvailable ? (index <= 1 ? "cold" : "warming") : "n/a"}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Recovery</span>
              <span className="mono-num normal-case tracking-normal">{branchAvailable ? "live" : "n/a"}</span>
            </div>
            <Bar value={branchAvailable ? 1 : 0} tone={branchAvailable ? "good" : "warn"} />
          </div>
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-5">
        <Panel title="Branch events" subtitle="recent backend timeline and hazard markers" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Cycle</th>
                <th className="px-3 py-2 font-medium">PC</th>
                <th className="px-3 py-2 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-12).reverse().map((sample: { cycle: number; pc: number }) => (
                <tr key={`${sample.cycle}-${sample.pc}`} className="border-t border-border/50">
                  <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{sample.cycle}</td>
                  <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(sample.pc)}</td>
                  <td className="px-3 py-2">
                    <Chip tone={branchAvailable ? "good" : "default"}>{branchAvailable ? "live" : "waiting"}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Control hazard log" subtitle="derived from backend hazards" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Kind</th>
                <th className="px-3 py-2 font-medium">Producer</th>
                <th className="px-3 py-2 font-medium">Consumer</th>
              </tr>
            </thead>
            <tbody>
              {controlHazards.slice(0, 8).map((hazard: any, index: number) => (
                <tr key={`${hazard.kind ?? hazard.type}-${index}`} className="border-t border-border/50">
                  <td className="px-3 py-2"><Chip tone="fault">{String(hazard.kind ?? hazard.type ?? "control")}</Chip></td>
                  <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{hazard.producer_pc ? hex(hazard.producer_pc) : "—"}</td>
                  <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{hazard.consumer_pc ? hex(hazard.consumer_pc) : "—"}</td>
                </tr>
              ))}
              {controlHazards.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                    {branch?.reason ?? "No control hazards were reported by the backend in this session."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

const LABELS = ["SN", "WN", "WT", "ST"] as const;

function signalValue(current: Record<string, string> | undefined, name: string): string {
  if (!current) return "—";
  return current[name] ?? current[name.split(".").at(-1) ?? name] ?? "—";
}
