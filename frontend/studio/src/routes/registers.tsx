import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { REG_NAMES } from "@/lib/sim/isa";
import { bin, groupBits, hex } from "@/lib/studio/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registers")({
  component: RegistersPage,
});

type Radix = "hex" | "dec" | "bin";

function RegistersPage() {
  const { sim } = useStudio();
  const [radix, setRadix] = useState<Radix>("hex");
  const [selected, setSelected] = useState(10);

  const render = (v: number) =>
    radix === "hex" ? hex(v) : radix === "dec" ? String(v | 0) : groupBits(bin(v), 4);

  const value = sim.regs[selected]!;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title="Architectural register file"
        subtitle="32 × 32-bit · x0 hardwired to zero"
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
                  radix === r
                    ? "border-signal/50 bg-signal/15 text-signal"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      >
        <div className={cn("grid gap-1.5 p-3", radix === "bin" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
          {Array.from({ length: 32 }, (_, i) => {
            const recent = sim.cycle - sim.regWrittenAtCycle[i]! <= 3 && sim.regWrittenAtCycle[i]! >= 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                  selected === i ? "border-signal/50 bg-signal/10" : "border-border/70 bg-surface-raised/30 hover:border-signal/30",
                  recent && "anim-value-flash",
                )}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="mono-num text-[10px] text-muted-foreground">x{i}</span>
                  <span className="mono-num text-[10px] font-medium text-signal/80">{REG_NAMES[i]}</span>
                  {recent && <span className="ml-auto size-1.5 rounded-full bg-good" aria-label="recently written" />}
                </div>
                <div className={cn("mono-num truncate text-[12px]", i === 0 ? "text-muted-foreground" : "text-foreground")}>
                  {render(sim.regs[i]!)}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-4">
        <Panel title={`Inspector — x${selected} / ${REG_NAMES[selected]}`} subtitle="all representations">
          <div className="space-y-2 p-3">
            {[
              ["Hexadecimal", hex(value)],
              ["Signed decimal", String(value | 0)],
              ["Unsigned decimal", String(value >>> 0)],
              ["Binary", groupBits(bin(value), 8)],
              ["Last written", sim.regWrittenAtCycle[selected]! < 0 ? "never" : `cycle ${sim.regWrittenAtCycle[selected]}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
                <div className="mono-num break-all text-[12px] text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="In-flight writers" subtitle="pipeline stages targeting this register">
          <div className="space-y-1.5 p-3">
            {(["EX", "MEM", "WB"] as const).map((stage) => {
              const slot = sim.slots[stage];
              const hit = slot.instr?.writesReg && slot.instr.rd === selected;
              return (
                <div key={stage} className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface-raised/30 px-3 py-2">
                  <span className="mono-num text-[11px] font-semibold">{stage}</span>
                  <span className="mono-num truncate text-[11px] text-muted-foreground">{slot.instr?.asm ?? "—"}</span>
                  <span className="ml-auto">{hit ? <Chip tone="warn">pending write</Chip> : <Chip>clear</Chip>}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
