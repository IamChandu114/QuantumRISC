import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { REG_NAMES } from "@/lib/sim/isa";
import {
  asNumber,
  bin,
  currentCycle,
  groupBits,
  hex,
  normalizeRegisters,
  registerHistory,
  timelineSamples,
} from "@/lib/studio/live";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registers")({
  component: RegistersPage,
});

type Radix = "hex" | "dec" | "bin";

function renderValue(value: unknown, radix: Radix) {
  const n = asNumber(value, 0) >>> 0;
  if (radix === "hex") return hex(n);
  if (radix === "dec") return String(n | 0);
  return groupBits(bin(n), 4);
}

function RegistersPage() {
  const { registers, waveforms, playback, metrics, isConnected } = useStudio();
  const [radix, setRadix] = useState<Radix>("hex");
  const [selected, setSelected] = useState(10);
  const [query, setQuery] = useState("");

  const normalized = useMemo(() => normalizeRegisters(registers), [registers]);
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => registerHistory(samples), [samples]);
  const cycle = currentCycle(playback, metrics);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((reg) => `${reg.name ?? ""} ${reg.abi ?? ""} x${reg.index}`.toLowerCase().includes(q));
  }, [normalized, query]);

  const selectedReg = normalized[selected] ?? normalized[0] ?? { index: 0, name: "x0", abi: "zero", value: 0, written_at_cycle: -1 };
  const selectedHistory = history.get(selectedReg.index) ?? [];
  const lastWritten = selectedReg.written_at_cycle ?? selectedHistory.at(-1)?.cycle ?? -1;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title="Architectural register file"
        subtitle="RV32I x0-x31 · live backend values only"
        className="xl:col-span-8"
        actions={
          <div className="flex gap-1" role="group" aria-label="Number base">
            {(["hex", "dec", "bin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadix(r)}
                aria-pressed={radix === r}
                className={cn(
                  "mono-num rounded-md border px-2 py-1 text-[10px] uppercase transition-colors",
                  radix === r ? "border-signal/50 bg-signal/15 text-signal" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      >
        <div className="border-b border-border/70 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search register name or ABI alias"
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-signal/40"
          />
        </div>
        <div className={cn("grid gap-1.5 p-3", radix === "bin" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
          {filtered.map((reg) => {
            const recent = cycle - asNumber(reg.written_at_cycle, -1) <= 3 && asNumber(reg.written_at_cycle, -1) >= 0;
            const active = selectedReg.index === reg.index;
            return (
              <button
                key={reg.index}
                type="button"
                onClick={() => setSelected(reg.index)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                  active ? "border-signal/50 bg-signal/10" : "border-border/70 bg-surface-raised/30 hover:border-signal/30",
                  recent && "anim-value-flash",
                )}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="mono-num text-[10px] text-muted-foreground">x{reg.index}</span>
                  <span className="mono-num text-[10px] font-medium text-signal/80">{reg.abi}</span>
                  {recent && <span className="ml-auto size-1.5 rounded-full bg-good" aria-label="recently written" />}
                </div>
                <div className={cn("mono-num truncate text-[12px]", reg.index === 0 ? "text-muted-foreground" : "text-foreground")}>
                  {renderValue(reg.value, radix)}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-4">
        <Panel title={`Inspector — x${selectedReg.index} / ${selectedReg.abi}`} subtitle="value, history, and clipboard copy">
          <div className="space-y-2 p-3">
            {[
              ["Hexadecimal", hex(selectedReg.value)],
              ["Signed decimal", String(asNumber(selectedReg.value, 0) | 0)],
              ["Unsigned decimal", String(asNumber(selectedReg.value, 0) >>> 0)],
              ["Binary", groupBits(bin(selectedReg.value), 8)],
              ["Last written", lastWritten < 0 ? "never" : `cycle ${lastWritten}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
                <div className="mono-num break-all text-[12px] text-foreground">{value}</div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(hex(selectedReg.value)).catch(() => undefined)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-foreground transition-colors hover:border-signal/40 hover:text-signal"
            >
              Copy value
            </button>
          </div>
        </Panel>

        <Panel title="Register history" subtitle="live writeback chronology for the selected register" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Cycle</th>
                <th className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {selectedHistory.slice(-12).reverse().map((entry) => (
                <tr key={`${entry.cycle}-${entry.value}`} className="border-t border-border/50">
                  <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{entry.cycle}</td>
                  <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(entry.value)}</td>
                </tr>
              ))}
              {selectedHistory.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                    No write history emitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="In-flight writers" subtitle="pipeline stages targeting this register">
          <div className="space-y-1.5 p-3">
            {["IF", "ID", "EX", "MEM", "WB"].map((stage) => {
              const hit = stage === "WB" && lastWritten >= 0 && cycle >= lastWritten;
              return (
                <div key={stage} className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface-raised/30 px-3 py-2">
                  <span className="mono-num text-[11px] font-semibold">{stage}</span>
                  <span className="mono-num truncate text-[11px] text-muted-foreground">
                    {hit ? `last write cycle ${lastWritten}` : "no pending writeback"}
                  </span>
                  <span className="ml-auto">{hit ? <Chip tone="warn">updated</Chip> : <Chip>clear</Chip>}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
