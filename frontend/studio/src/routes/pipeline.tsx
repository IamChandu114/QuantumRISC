import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { REG_NAMES } from "@/lib/sim/isa";
import {
  asNumber,
  derivedProgramHistory,
  groupBits,
  hex,
  historyWindow,
  normalizeSignals,
  pct,
  sampleField,
  timelineSamples,
} from "@/lib/studio/live";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
});

const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;

function decodeInstruction(word: number | undefined): Array<[string, string]> {
  const value = asNumber(word, 0) >>> 0;
  const opcode = value & 0x7f;
  const rd = (value >>> 7) & 0x1f;
  const funct3 = (value >>> 12) & 0x7;
  const rs1 = (value >>> 15) & 0x1f;
  const rs2 = (value >>> 20) & 0x1f;
  const funct7 = (value >>> 25) & 0x7f;
  const immI = value >> 20;
  return [
    ["opcode", hex(opcode, 2)],
    ["rd", `x${rd} (${REG_NAMES[rd]})`],
    ["rs1", `x${rs1} (${REG_NAMES[rs1]})`],
    ["rs2", `x${rs2} (${REG_NAMES[rs2]})`],
    ["funct3", hex(funct3, 1)],
    ["funct7", hex(funct7, 2)],
    ["imm[11:0]", String(immI)],
    ["word", hex(value)],
  ];
}

function toneForStage(index: number, total: number, status?: string) {
  if (status === "stalled") return "border-warn/50 bg-warn/10";
  if (status === "flushed") return "border-fault/50 bg-fault/10";
  if (index === 0) return "border-signal/45 bg-signal/10";
  if (index === total - 1) return "border-good/45 bg-good/10";
  return "border-border bg-surface-raised/35";
}

function PipelinePage() {
  const { pipeline, forwarding, metrics, playback, architecture, waveforms, hazards, isConnected } = useStudio();

  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const recent = useMemo(() => historyWindow(derivedProgramHistory(samples, 48), 12), [samples]);
  const current = recent.at(-1);
  const currentWord = asNumber(
    pipeline?.instruction ??
      pipeline?.word ??
      sampleField(waveforms?.current as any, "pipeline_cpu_complete_tb.DUT.if_instruction [31:0]"),
    0,
  );
  const currentPc = asNumber(pipeline?.pc ?? architecture?.pc, 0);
  const totalCycles = asNumber(metrics?.cycles, 0);
  const stallRate = totalCycles > 0 ? asNumber(metrics?.stalls ?? metrics?.stallCycles, 0) / totalCycles : 0;

  const stageModel = useMemo(() => {
    const stream = [...recent].slice(-5);
    return STAGES.map((stage, index) => {
      const evt = stream[stream.length - 1 - index];
      const active = Boolean(evt);
      const status = index === 0 ? "active" : index === 1 && active ? "active" : index < stream.length ? "active" : "bubble";
      return {
        stage,
        status,
        pc: evt?.pc ?? null,
        instr: evt?.instr ?? null,
        cycle: evt?.cycle ?? null,
      };
    });
  }, [recent]);

  const controlSignals = normalizeSignals(waveforms, architecture).filter((name) => /branch|stall|flush|cache|pc|instruction/i.test(name));

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title="Datapath workstation"
        subtitle={`cycle ${asNumber(playback?.cursor ?? metrics?.cycles, 0)} · live backend pipeline state`}
        className="xl:col-span-12"
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="signal">live</Chip>
            <Chip tone="warn">stalls {pct(stallRate, 1)}</Chip>
            <Chip tone="fault">hazards {asNumber(metrics?.hazards, hazards.length).toLocaleString()}</Chip>
          </div>
        }
        scroll={false}
      >
        <div className="grid gap-3 p-3 lg:grid-cols-[1.5fr_0.95fr]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {stageModel.map((slot, index) => (
              <div key={slot.stage} className={cn("rounded-xl border p-3 transition-colors", toneForStage(index, stageModel.length, slot.status))}>
                <div className="flex items-center justify-between">
                  <span className="mono-num text-[12px] font-semibold tracking-[0.18em] text-foreground">{slot.stage}</span>
                  <span className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">{slot.status}</span>
                </div>
                <div className="mono-num mt-2 truncate text-[12px] text-foreground">
                  {slot.instr ? hex(slot.instr) : "bubble / waiting"}
                </div>
                <div className="mono-num mt-1 text-[10.5px] text-muted-foreground">
                  {slot.pc !== null ? `PC ${hex(slot.pc)}` : "no sample"}
                </div>
                {slot.cycle !== null && <div className="mono-num mt-1 text-[10px] text-muted-foreground/80">cycle {slot.cycle}</div>}
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-border/70 bg-surface-raised/35 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Current instruction metadata</div>
                <div className="mono-num text-[11px] text-muted-foreground">
                  {isConnected ? "backend-sourced cycle snapshot" : "waiting for backend snapshots"}
                </div>
              </div>
              <Chip tone="signal">{hex(currentPc)}</Chip>
            </div>
            <div className="mono-num break-all rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-[12px] text-foreground">
              {hex(currentWord)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {decodeInstruction(currentWord).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/70 bg-background/30 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
                  <div className="mono-num truncate text-[11.5px] text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Bypass network" subtitle="live operand routing into EX" className="xl:col-span-5">
        <div className="space-y-2 p-3">
          {(forwarding as any[]).length > 0 ? (
            (forwarding as any[]).slice(0, 8).map((item: any, index: number) => (
              <div key={`${item.from}-${item.to}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-2.5">
                <svg viewBox="0 0 120 20" className="h-5 w-28 shrink-0" aria-hidden="true">
                  <path d="M4 10 H80 M80 10 l-6 -5 M80 10 l-6 5" fill="none" stroke="var(--signal)" strokeWidth="1.5" />
                </svg>
                <span className="mono-num text-[12px] text-foreground">{item.path ?? `${item.from} → ${item.to}`}</span>
                <span className="mono-num ml-auto text-[10px] text-muted-foreground">{item.reason ?? "RAW"}</span>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-3 text-[12px] text-muted-foreground">
              No forwarded operands in the current backend snapshot.
            </div>
          )}
          <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
            Hazards: {(hazards as any[]).length.toLocaleString()} · control signals tracked: {controlSignals.length.toLocaleString()}
          </div>
        </div>
      </Panel>

      <Panel title="Cycle trace" subtitle="recent live samples" className="xl:col-span-7" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cycle</th>
              <th className="px-3 py-2 font-medium">PC</th>
              <th className="px-3 py-2 font-medium">Instruction</th>
              <th className="px-3 py-2 font-medium">State</th>
            </tr>
          </thead>
          <tbody>
            {recent.slice(-14).reverse().map((sample, index) => (
              <tr key={`${sample.cycle}-${sample.pc}-${index}`} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{sample.cycle}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{hex(sample.pc)}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-foreground/90">{hex(sample.instr)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {index === 0 && <Chip tone="signal">current</Chip>}
                    {index > 0 && sample.pc === recent[recent.length - 1]?.pc && <Chip tone="warn">stall</Chip>}
                    {index > 0 && sample.instr !== recent[recent.length - 1]?.instr && <Chip tone="good">advance</Chip>}
                  </div>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Waiting for backend cycle data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Decode detail" subtitle="ID-stage field extraction" className="xl:col-span-12">
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-8">
          {decodeInstruction(currentWord).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
              <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{key}</div>
              <div className="mono-num truncate text-[12px] text-foreground">{value}</div>
            </div>
          ))}
          <div className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2 sm:col-span-2 lg:col-span-4">
            <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Signal view</div>
            <div className="mono-num mt-1 text-[11px] text-foreground/90">{groupBits(hex(currentWord).replace(/^0x/i, ""), 4)}</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
