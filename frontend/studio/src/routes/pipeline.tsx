import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Panel } from "@/components/studio/panel";
import { STAGES, type StageName } from "@/lib/sim/core";
import { hex } from "@/lib/studio/format";
import { REG_NAMES } from "@/lib/sim/isa";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
});

const STAGE_DESC: Record<StageName, string> = {
  IF: "Instruction fetch · L1I · next-PC",
  ID: "Decode · regfile read · interlock",
  EX: "ALU · branch resolve · bypass mux",
  MEM: "L1D access · store buffer",
  WB: "Architectural commit",
};

function statusTone(status: string) {
  switch (status) {
    case "active": return "border-signal/45 bg-signal/10";
    case "stalled": return "border-warn/50 bg-warn/10";
    case "flushed": return "border-fault/50 bg-fault/10";
    case "bubble": return "border-dashed border-border bg-muted/25";
    default: return "border-border bg-muted/15";
  }
}

function PipelinePage() {
  const { sim } = useStudio();
  const trace = sim.history.slice(-14);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel
        title="Datapath — 5-stage in-order pipeline"
        subtitle={`cycle ${sim.cycle} · PC ${hex(sim.pc)}`}
        className="xl:col-span-12"
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="signal">active</Chip>
            <Chip tone="warn">stalled</Chip>
            <Chip tone="fault">flushed</Chip>
            <Chip>bubble</Chip>
          </div>
        }
        scroll={false}
      >
        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => {
            const slot = sim.slots[stage];
            const fwd = stage === "EX" ? sim.forwarding : [];
            return (
              <div
                key={stage}
                className={cn(
                  "relative flex min-h-[168px] flex-col rounded-xl border p-3 transition-colors",
                  statusTone(slot.status),
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="mono-num text-[12px] font-bold tracking-widest text-foreground">{stage}</span>
                  <span className="mono-num text-[9px] uppercase tracking-wider text-muted-foreground">
                    {slot.status}
                  </span>
                </div>
                <p className="mono-num mt-0.5 text-[9.5px] leading-tight text-muted-foreground">{STAGE_DESC[stage]}</p>

                <div key={slot.uid} className="anim-stage-enter mt-3 min-h-[60px] rounded-lg border border-border/70 bg-background/50 p-2">
                  {slot.instr ? (
                    <>
                      <div className="mono-num truncate text-[12px] font-semibold text-foreground">{slot.instr.asm}</div>
                      <div className="mono-num mt-1 text-[10px] text-muted-foreground">{hex(slot.instr.pc)}</div>
                      <div className="mono-num text-[10px] text-muted-foreground/80">{hex(slot.instr.word)}</div>
                    </>
                  ) : (
                    <div className="mono-num pt-3 text-center text-[11px] text-muted-foreground/70">
                      {slot.status === "flushed" ? "squashed" : slot.status === "bubble" ? "bubble (nop)" : "idle"}
                    </div>
                  )}
                </div>

                {slot.note ? (
                  <div className="mono-num mt-2 truncate text-[9.5px] text-warn">{slot.note}</div>
                ) : null}

                {fwd.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-2">
                    {fwd.map((f, i) => (
                      <Chip key={`${f.from}-${f.to}-${i}`} tone="violet">
                        {f.from}→{f.to} x{f.register}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Bypass network" subtitle="live operand routing into EX" className="xl:col-span-5">
        <div className="space-y-2 p-3">
          {["EX/MEM → EX", "MEM/WB → EX", "Regfile → EX"].map((path) => {
            const active =
              (path.startsWith("EX/MEM") && sim.forwarding.some((f) => f.from === "EX/MEM")) ||
              (path.startsWith("MEM/WB") && sim.forwarding.some((f) => f.from === "MEM/WB")) ||
              (path.startsWith("Regfile") && sim.forwarding.length === 0);
            return (
              <div
                key={path}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  active ? "border-violet-signal/45 bg-violet-signal/10" : "border-border bg-surface-raised/30",
                )}
              >
                <svg viewBox="0 0 120 20" className={cn("h-5 w-28 shrink-0", active && "anim-flow")} aria-hidden="true">
                  <path
                    d="M4 10 H80 M80 10 l-6 -5 M80 10 l-6 5"
                    fill="none"
                    stroke={active ? "var(--violet-signal)" : "var(--border)"}
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="mono-num text-[12px] text-foreground/90">{path}</span>
                <span className={cn("mono-num ml-auto text-[10px]", active ? "text-violet-signal" : "text-muted-foreground")}>
                  {active ? "ASSERTED" : "idle"}
                </span>
              </div>
            );
          })}
          <div className="mono-num rounded-lg border border-border bg-surface-raised/30 px-3 py-2 text-[11px] text-muted-foreground">
            Total bypasses: <span className="text-foreground">{sim.metrics.forwards.toLocaleString()}</span> · load-use
            interlocks: <span className="text-warn">{sim.metrics.loadUseStalls}</span> · flushes:{" "}
            <span className="text-fault">{sim.metrics.flushes}</span>
          </div>
        </div>
      </Panel>

      <Panel title="Stage trace" subtitle="last 14 cycles" className="xl:col-span-7" bodyClassName="p-0">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cy</th>
              {STAGES.map((s) => (
                <th key={s} className="px-2 py-2 font-medium">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No cycles executed yet.
                </td>
              </tr>
            ) : (
              trace.map((c) => (
                <tr key={c.cycle} className="border-t border-border/50">
                  <td className="mono-num px-3 py-1.5 text-[11px] text-muted-foreground">{c.cycle}</td>
                  {STAGES.map((s) => {
                    const cell = c.stages[s];
                    return (
                      <td key={s} className="max-w-[140px] px-2 py-1.5">
                        <span
                          className={cn(
                            "mono-num block truncate text-[10.5px]",
                            cell.status === "stalled" && "text-warn",
                            cell.status === "flushed" && "text-fault",
                            cell.status === "active" && "text-foreground/90",
                            (cell.status === "bubble" || cell.status === "empty") && "text-muted-foreground/50",
                          )}
                        >
                          {cell.asm ?? (cell.status === "bubble" ? "nop" : "—")}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Decode detail" subtitle="ID stage field extraction" className="xl:col-span-12">
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-8">
          {(() => {
            const i = sim.slots.ID.instr;
            const fields: Array<[string, string]> = i
              ? [
                  ["opcode", hex(i.word & 0x7f, 2)],
                  ["rd", `x${i.rd} (${REG_NAMES[i.rd]})`],
                  ["rs1", i.usesRs1 ? `x${i.rs1} (${REG_NAMES[i.rs1]})` : "—"],
                  ["rs2", i.usesRs2 ? `x${i.rs2} (${REG_NAMES[i.rs2]})` : "—"],
                  ["imm", String(i.imm)],
                  ["class", i.kind],
                  ["pc", hex(i.pc)],
                  ["word", hex(i.word)],
                ]
              : [["opcode", "—"], ["rd", "—"], ["rs1", "—"], ["rs2", "—"], ["imm", "—"], ["class", "—"], ["pc", "—"], ["word", "—"]];
            return fields.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/70 bg-surface-raised/40 px-2.5 py-2">
                <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
                <div className="mono-num truncate text-[12px] text-foreground">{v}</div>
              </div>
            ));
          })()}
        </div>
      </Panel>
    </div>
  );
}
