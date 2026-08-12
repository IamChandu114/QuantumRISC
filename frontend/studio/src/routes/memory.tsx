import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { ascii, hex } from "@/lib/studio/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memory")({
  component: MemoryPage,
});

const SEGMENTS = [
  { name: ".text", base: 0x0000, size: 0x0400, tone: "signal" as const, note: "instruction image" },
  { name: ".data", base: 0x1000, size: 0x0200, tone: "good" as const, note: "vector A / B" },
  { name: ".bss", base: 0x1200, size: 0x0200, tone: "violet" as const, note: "results" },
  { name: "stack", base: 0x1e00, size: 0x0200, tone: "warn" as const, note: "grows down" },
];

const BYTES_PER_ROW = 16;
const ROWS = 24;

function MemoryPage() {
  const { sim } = useStudio();
  const [base, setBase] = useState(0x1100);
  const [query, setQuery] = useState("0x1100");

  const touched = useMemo(() => {
    const map = new Map<number, { write: boolean; cycle: number }>();
    for (const e of sim.memoryEvents.slice(-24)) {
      for (let b = 0; b < 4; b += 1) map.set(e.address + b, { write: e.write, cycle: e.cycle });
    }
    return map;
  }, [sim.memoryEvents, sim.cycle]);

  const go = (value: string) => {
    const parsed = Number.parseInt(value.trim().replace(/^0x/i, ""), 16);
    if (Number.isFinite(parsed)) setBase(Math.max(0, Math.min(0x2000 - BYTES_PER_ROW * ROWS, parsed & ~0xf)));
  };

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Address space" subtitle="8 KiB flat physical map" className="xl:col-span-3">
        <div className="space-y-1.5 p-3">
          {SEGMENTS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => { setBase(s.base); setQuery(hex(s.base, 4)); }}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                base >= s.base && base < s.base + s.size
                  ? "border-signal/45 bg-signal/10"
                  : "border-border/70 bg-surface-raised/30 hover:border-signal/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="mono-num text-[12px] font-semibold text-foreground">{s.name}</span>
                <span className="ml-auto"><Chip tone={s.tone}>{hex(s.base, 4)}</Chip></span>
              </div>
              <div className="mono-num text-[10px] text-muted-foreground">{s.note} · {s.size} B</div>
            </button>
          ))}

          <form
            className="pt-2"
            onSubmit={(e) => { e.preventDefault(); go(query); }}
          >
            <label htmlFor="addr" className="mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
              Go to address
            </label>
            <div className="flex gap-1.5">
              <input
                id="addr"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
                className="mono-num h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground"
              />
              <button
                type="submit"
                className="mono-num h-8 shrink-0 rounded-lg border border-signal/40 bg-signal/10 px-2.5 text-[11px] text-signal"
              >
                GO
              </button>
            </div>
          </form>
        </div>
      </Panel>

      <Panel
        title="Hex dump"
        subtitle={`${hex(base, 4)} – ${hex(base + BYTES_PER_ROW * ROWS - 1, 4)}`}
        className="xl:col-span-9"
        actions={
          <div className="flex gap-1.5">
            <Chip tone="good">load</Chip>
            <Chip tone="warn">store</Chip>
          </div>
        }
      >
        <div className="p-3">
          <div className="mono-num inline-block min-w-full text-[11px] leading-6">
            <div className="mb-1 flex gap-3 text-muted-foreground/70">
              <span className="w-[74px] shrink-0">ADDR</span>
              <span className="shrink-0 tracking-[0.32em]">
                {Array.from({ length: BYTES_PER_ROW }, (_, i) => i.toString(16).toUpperCase()).join(" ")}
              </span>
              <span className="shrink-0">ASCII</span>
            </div>
            {Array.from({ length: ROWS }, (_, row) => {
              const addr = base + row * BYTES_PER_ROW;
              const bytes = Array.from({ length: BYTES_PER_ROW }, (_, i) => sim.memory[addr + i] ?? 0);
              return (
                <div key={addr} className="flex gap-3 whitespace-nowrap rounded hover:bg-muted/30">
                  <span className="w-[74px] shrink-0 text-signal/70">{hex(addr, 4)}</span>
                  <span className="shrink-0">
                    {bytes.map((b, i) => {
                      const t = touched.get(addr + i);
                      return (
                        <span
                          key={i}
                          className={cn(
                            "px-[1px]",
                            b === 0 ? "text-muted-foreground/45" : "text-foreground/90",
                            t && (t.write ? "rounded bg-warn/25 text-warn" : "rounded bg-good/20 text-good"),
                          )}
                        >
                          {b.toString(16).padStart(2, "0").toUpperCase()}{" "}
                        </span>
                      );
                    })}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {bytes.map((b) => ascii(b)).join("")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title="Load/store trace" subtitle="most recent data-memory transactions" className="xl:col-span-12" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">Op</th>
              <th className="px-3 py-2 font-medium">Address</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">L1D</th>
            </tr>
          </thead>
          <tbody>
            {sim.memoryEvents.slice(-12).reverse().map((e, i) => (
              <tr key={`${e.cycle}-${i}`} className="border-t border-border/50">
                <td className="mono-num px-3 py-1.5 text-[11px] text-muted-foreground">{e.cycle}</td>
                <td className="px-3 py-1.5"><Chip tone={e.write ? "warn" : "good"}>{e.write ? "STORE" : "LOAD"}</Chip></td>
                <td className="mono-num px-3 py-1.5 text-[11px]">{hex(e.address)}</td>
                <td className="mono-num px-3 py-1.5 text-[11px]">{hex(e.value)} <span className="text-muted-foreground">({e.value | 0})</span></td>
                <td className="px-3 py-1.5"><Chip tone={e.hit ? "good" : "fault"}>{e.hit ? "HIT" : "MISS"}</Chip></td>
              </tr>
            ))}
            {sim.memoryEvents.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-[12px] text-muted-foreground">No memory traffic yet.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
