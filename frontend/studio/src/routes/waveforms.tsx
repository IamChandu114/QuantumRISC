import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Metric, Panel } from "@/components/studio/panel";
import {
  asNumber,
  derivedProgramHistory,
  hex,
  normalizeSignals,
  timelineSamples,
} from "@/lib/studio/live";

export const Route = createFileRoute("/waveforms")({
  component: WaveformsPage,
});

const DEFAULT_VISIBLE = 12;

function WaveformsPage() {
  const { waveforms, playback, architecture, isConnected } = useStudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startOffset: number }>({ active: false, startX: 0, startOffset: 0 });
  const [zoom, setZoom] = useState(14);
  const [offset, setOffset] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [markers, setMarkers] = useState<number[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => derivedProgramHistory(samples, 160), [samples]);
  const signalNames = useMemo(() => normalizeSignals(waveforms as any, architecture), [waveforms, architecture]);
  const filteredSignals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signalNames.filter((name: string) => !q || name.toLowerCase().includes(q));
  }, [signalNames, query]);

  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const rawName of filteredSignals as Array<string | undefined>) {
      const name = `${rawName ?? ""}`;
      const dot = name.indexOf(".");
      const group = dot >= 0 ? name.slice(0, dot) : "top";
      const bucket = map.get(group) ?? [];
      bucket.push(name);
      map.set(group, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSignals]);

  const visibleSignals = useMemo(() => {
    const selected = groups.flatMap(([group, names]) => (collapsed[group] ? [] : names)).slice(0, 24);
    return selected.length > 0 ? selected : filteredSignals.slice(0, DEFAULT_VISIBLE);
  }, [groups, collapsed, filteredSignals]);

  const visibleWindow = useMemo(() => {
    const maxStart = Math.max(0, samples.length - Math.max(16, Math.floor(1200 / zoom)));
    const start = Math.min(maxStart, Math.max(0, offset));
    const count = Math.max(16, Math.floor(1200 / zoom));
    return samples.slice(start, start + count);
  }, [samples, offset, zoom]);

  const cursorCycle = cursor ?? asNumber(playback?.cursor ?? waveforms?.cursor ?? history.at(-1)?.cycle, 0);
  const cursorSample = samples.find((sample) => asNumber(sample.time, 0) === cursorCycle) ?? samples.at(-1) ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapRef.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    const height = Math.max(280, visibleSignals.length * 28 + 40);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 14, 24, 0.72)";
    ctx.fillRect(0, 0, width, height);

    const rowHeight = 28;
    const leftGutter = 160;
    const rightPad = 16;
    const topPad = 20;
    const count = Math.max(visibleWindow.length, 1);
    const step = Math.max(1, (width - leftGutter - rightPad) / Math.max(1, count - 1));

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i += 1) {
      const x = leftGutter + i * step;
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, height - 8);
      ctx.stroke();
      if (i % 4 === 0) {
        ctx.fillStyle = "rgba(209, 223, 241, 0.6)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(String(asNumber(visibleWindow[i]?.time, offset + i)), x + 2, 12);
      }
    }

    visibleSignals.forEach((signal, rowIndex) => {
      const y = topPad + rowIndex * rowHeight;
      ctx.fillStyle = rowIndex % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent";
      ctx.fillRect(0, y - 12, width, rowHeight);

      ctx.fillStyle = "rgba(233, 240, 255, 0.85)";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText(signal, 12, y + 2);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(69, 211, 255, 0.9)";
      ctx.lineWidth = 1.4;
      let prevHigh = false;
      visibleWindow.forEach((sample, index) => {
        const value = signalValue(sample, signal);
        const high = isHigh(value);
        const x = leftGutter + index * step;
        const waveY = high ? y - 6 : y + 7;
        if (index === 0) {
          ctx.moveTo(x, waveY);
          prevHigh = high;
          return;
        }
        if (prevHigh !== high) {
          ctx.lineTo(x, prevHigh ? y - 6 : y + 7);
        }
        ctx.lineTo(x, waveY);
        prevHigh = high;
      });
      ctx.stroke();

      if (cursorSample) {
        const currentValue = signalValue(cursorSample, signal);
        ctx.fillStyle = "rgba(76, 201, 240, 0.95)";
        ctx.fillText(String(currentValue), width - 120, y + 2);
      }
    });

    if (cursorSample) {
      const cursorIndex = visibleWindow.findIndex((sample) => asNumber(sample.time, 0) === cursorCycle);
      if (cursorIndex >= 0) {
        const x = leftGutter + cursorIndex * step;
        ctx.strokeStyle = "rgba(69, 211, 255, 0.75)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x, height - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    markers.forEach((marker) => {
      const markerIndex = visibleWindow.findIndex((sample) => asNumber(sample.time, 0) === marker);
      if (markerIndex < 0) return;
      const x = leftGutter + markerIndex * step;
      ctx.strokeStyle = "rgba(214, 135, 70, 0.8)";
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, height - 8);
      ctx.stroke();
    });
  }, [visibleSignals, visibleWindow, cursorCycle, cursorSample, markers, offset]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragRef.current.active || !wrapRef.current) return;
      const delta = event.clientX - dragRef.current.startX;
      const maxStart = Math.max(0, samples.length - Math.max(16, Math.floor(1200 / zoom)));
      setOffset(Math.min(maxStart, Math.max(0, dragRef.current.startOffset - Math.round(delta / Math.max(1, zoom / 3)))));
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [samples.length, zoom]);

  const onCanvasClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const leftGutter = 160;
    const count = Math.max(visibleWindow.length, 1);
    const step = Math.max(1, (rect.width - leftGutter - 16) / Math.max(1, count - 1));
    const index = Math.max(0, Math.min(visibleWindow.length - 1, Math.round((x - leftGutter) / step)));
    const sample = visibleWindow[index];
    if (!sample) return;
    const cycle = asNumber(sample.time, 0);
    setCursor(cycle);
    setMarkers((prev) => Array.from(new Set([...prev, cycle])).slice(-8));
  };

  const onCanvasDown = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    dragRef.current.active = true;
    dragRef.current.startX = event.clientX;
    dragRef.current.startOffset = offset;
  };

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title="Waveform workstation"
        subtitle="HTML5 canvas VCD explorer with cursor, markers, zoom, and pan"
        className="xl:col-span-12"
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="signal">{isConnected ? "live" : "waiting"}</Chip>
            <Chip>cursor {cursorCycle}</Chip>
            <Chip>signals {visibleSignals.length}</Chip>
          </div>
        }
        scroll={false}
      >
        <div className="grid gap-3 p-3 xl:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search signals"
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-signal/40"
            />
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-2">
              {groups.map(([group, names]) => (
                <div key={group} className="mb-2">
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-foreground transition-colors hover:bg-muted/30"
                  >
                    <span className="mono-num text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{group}</span>
                    <span className="mono-num ml-auto text-[10px] text-muted-foreground">{names.length}</span>
                  </button>
                  {!collapsed[group] && (
                    <div className="mt-1 space-y-1 pl-2">
                      {names.slice(0, 12).map((name) => (
                        <label key={name} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={query.trim().toLowerCase() === name.toLowerCase()}
                            onChange={() => {
                              const safeName = `${name}`;
                              setQuery((current) => (current.trim().toLowerCase() === safeName.toLowerCase() ? "" : safeName));
                            }}
                            className="accent-cyan-400"
                          />
                          <span className="truncate">{name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {groups.length === 0 && <div className="px-2 py-4 text-[12px] text-muted-foreground">No signals in the current snapshot.</div>}
            </div>
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Markers</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {markers.length > 0 ? markers.map((marker) => <Chip key={marker} tone="warn">{marker}</Chip>) : <span className="mono-num text-[11px] text-muted-foreground">Click the canvas to add markers.</span>}
              </div>
            </div>
          </div>

          <div ref={wrapRef} className="rounded-xl border border-border/70 bg-surface-raised/25 p-2">
            <div className="mb-2 flex items-center gap-2">
              <button type="button" onClick={() => setZoom((z) => Math.min(40, z + 2))} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground">
                Zoom in
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.max(6, z - 2))} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground">
                Zoom out
              </button>
              <button type="button" onClick={() => setOffset((o) => Math.max(0, o - 8))} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground">
                Pan left
              </button>
              <button type="button" onClick={() => setOffset((o) => o + 8)} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground">
                Pan right
              </button>
              <button type="button" onClick={() => setMarkers((prev) => prev.slice(0, -1))} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground">
                Drop marker
              </button>
              <div className="mono-num ml-auto text-[10px] text-muted-foreground">
                offset {offset} · zoom {zoom}px
              </div>
            </div>
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              onMouseDown={onCanvasDown}
              className="w-full cursor-crosshair rounded-lg border border-border/70 bg-background/70"
              aria-label="VCD waveform canvas"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Cursor measurement" subtitle={cursorSample ? `cycle ${cursorCycle}` : "no cursor placed"} className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-6">
          {cursorSample ? (
            <>
              {visibleSignals.slice(0, 8).map((signal) => (
                <div key={signal} className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{signal}</div>
                  <div className="mono-num truncate text-[11.5px] text-foreground">{signalValue(cursorSample, signal)}</div>
                </div>
              ))}
              <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">History</div>
                <div className="mono-num truncate text-[11.5px] text-foreground">{hex(cursorSample.time ?? cursorCycle)}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Instruction</div>
                <div className="mono-num truncate text-[11.5px] text-foreground">{cursorSample.changed ? Object.keys(cursorSample.changed).length : 0} signals</div>
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

function signalValue(sample: { changed?: Record<string, string> }, name: string): string {
  const changed = sample.changed ?? {};
  const simplified = name.split(".").at(-1) || name;
  return changed[name] ?? changed[simplified] ?? "0";
}

function isHigh(value: string): boolean {
  return value.length > 1 ? /^(1|b1|h[1-9a-f])/i.test(value) : value === "1";
}
