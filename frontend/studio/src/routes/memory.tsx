import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Metric, Panel } from "@/components/studio/panel";
import {
  asNumber,
  currentCycle,
  derivedProgramHistory,
  hex,
  historyWindow,
  normalizeMemoryWords,
  timelineSamples,
} from "@/lib/studio/live";
import { ascii } from "@/lib/studio/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memory")({
  component: MemoryPage,
});

const BYTES_PER_ROW = 16;

function MemoryPage() {
  const { memory, waveforms, playback, metrics, isConnected } = useStudio();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"byte" | "word">("byte");
  const [selected, setSelected] = useState<number | null>(null);

  const words = useMemo(() => normalizeMemoryWords(memory), [memory]);
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const events = useMemo(() => historyWindow(derivedProgramHistory(samples, 96), 24), [samples]);
  const cycle = currentCycle(playback, metrics);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter((word) => hex(word.address).toLowerCase().includes(q) || hex(word.value).toLowerCase().includes(q));
  }, [words, query]);

  const base = filtered[0]?.address ?? 0;
  const visible = filtered.slice(0, 512);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Memory workstation" subtitle="live backend memory window and trace-derived instruction stream" className="xl:col-span-4" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3">
          <Metric label="Window" value={filtered.length.toLocaleString()} tone="signal" hint="backend cells" />
          <Metric label="Cycle" value={cycle.toLocaleString()} hint={isConnected ? "live" : "waiting"} />
          <Metric label="Trace events" value={events.length.toLocaleString()} tone="good" />
          <Metric label="Mode" value={view.toUpperCase()} tone={view === "word" ? "good" : "signal"} />
        </div>
        <div className="border-t border-border/70 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search address or value"
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-signal/40"
          />
          <div className="mt-2 flex gap-1">
            <button
              type="button"
              onClick={() => setView("byte")}
              className={cn("rounded-md border px-2.5 py-1 text-[10px] uppercase", view === "byte" ? "border-signal/50 bg-signal/15 text-signal" : "border-border text-muted-foreground")}
            >
              Byte view
            </button>
            <button
              type="button"
              onClick={() => setView("word")}
              className={cn("rounded-md border px-2.5 py-1 text-[10px] uppercase", view === "word" ? "border-signal/50 bg-signal/15 text-signal" : "border-border text-muted-foreground")}
            >
              Word view
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Live window" subtitle={filtered.length ? `${hex(base)} and forward` : "waiting for backend memory payload"} className="xl:col-span-8" bodyClassName="p-0">
        <div className="panel-scroll max-h-[72vh]">
          {view === "word" ? (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface/95 backdrop-blur">
                <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">ASCII</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 256).map((word) => (
                  <tr key={word.address} className="border-t border-border/50" onClick={() => setSelected(word.address)}>
                    <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{hex(word.address)}</td>
                    <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(word.value)}</td>
                    <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">
                      {groupAscii(hex(word.value))}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                      No backend memory data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
              {visible.map((word) => {
                const bytes = Array.from({ length: BYTES_PER_ROW }, (_, i) => (word.value >>> (i * 8)) & 0xff);
                return (
                  <button
                    key={word.address}
                    type="button"
                    onClick={() => setSelected(word.address)}
                    className={cn(
                      "rounded-lg border border-border/70 bg-surface-raised/35 p-3 text-left transition-colors hover:border-signal/40",
                      selected === word.address && "border-signal/50 bg-signal/10",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono-num text-[11px] text-muted-foreground">{hex(word.address)}</span>
                      <Chip tone="signal">live</Chip>
                    </div>
                    <div className="mono-num mt-2 text-[12px] text-foreground">{hex(word.value)}</div>
                    <div className="mono-num mt-2 grid grid-cols-8 gap-1 text-[10px] text-muted-foreground">
                      {bytes.slice(0, 8).map((byte, index) => (
                        <span key={`${word.address}-${index}`} className="rounded border border-border/60 bg-background/40 px-1 py-0.5 text-center">
                          {hex(byte, 2)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <div className="col-span-full rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No backend memory data available yet.
                </div>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Trace panel" subtitle="most recent program events observed by the backend" className="xl:col-span-12" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">PC</th>
              <th className="px-3 py-2 font-medium">Instruction</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(-12).reverse().map((event) => (
              <tr key={`${event.cycle}-${event.pc}`} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{event.cycle}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(event.pc)}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground/90">{hex(event.instr)}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Waiting for program trace data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function groupAscii(value: string): string {
  const compact = value.replace(/^0x/i, "");
  return compact
    .match(/.{1,2}/g)
    ?.map((chunk) => {
      const byte = Number.parseInt(chunk, 16);
      return ascii(Number.isFinite(byte) ? byte : 0);
    })
    .join("") ?? "";
}
