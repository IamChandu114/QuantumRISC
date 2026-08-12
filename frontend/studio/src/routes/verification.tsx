import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import { ASSERTIONS } from "@/lib/sim/core";
import { PROGRAM } from "@/lib/sim/isa";
import { pct } from "@/lib/studio/format";

export const Route = createFileRoute("/verification")({
  component: VerificationPage,
});

function VerificationPage() {
  const { sim } = useStudio();
  const results = ASSERTIONS.map((a) => ({ ...a, pass: a.check(sim) }));
  const failing = results.filter((r) => !r.pass);

  const opcodes = [...new Set(PROGRAM.map((i) => i.mnemonic))].sort();
  const covered = opcodes.filter((m) => (sim.opcodeCoverage.get(m) ?? 0) > 0);
  const opcodeCoverage = opcodes.length === 0 ? 0 : covered.length / opcodes.length;

  const scenarios = [
    { name: "load_use_interlock", hit: sim.metrics.loadUseStalls > 0 },
    { name: "ex_mem_bypass", hit: sim.metrics.forwards > 0 },
    { name: "branch_mispredict_recovery", hit: sim.metrics.flushes > 0 },
    { name: "l1d_miss_refill", hit: sim.dCache.stats.misses > 0 },
    { name: "l1d_eviction", hit: sim.dCache.stats.evictions > 0 },
    { name: "dirty_writeback", hit: sim.dCache.stats.writeBacks > 0 },
    { name: "backward_taken_branch", hit: [...sim.predictor.btb.entries()].some(([pc, t]) => t < pc) },
    { name: "store_commit", hit: sim.memoryEvents.some((e) => e.write) },
  ];
  const scenarioCoverage = scenarios.filter((s) => s.hit).length / scenarios.length;

  const suites = [
    { name: "rv32ui-p-add", cycles: 412, status: "PASS" },
    { name: "rv32ui-p-lw", cycles: 508, status: "PASS" },
    { name: "rv32ui-p-bne", cycles: 366, status: "PASS" },
    { name: "hazard_random_10k", cycles: 10_240, status: "PASS" },
    { name: "cache_thrash_stress", cycles: 8_192, status: failing.length > 0 ? "FAIL" : "PASS" },
    { name: "predictor_alias_sweep", cycles: 6_144, status: sim.predictor.accuracy < 0.5 && sim.cycle > 500 ? "WARN" : "PASS" },
  ];

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Assertion status" subtitle="evaluated every render against live core state" className="xl:col-span-7">
        <div className="space-y-1.5 p-3">
          {results.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-surface-raised/30 px-3 py-2">
              <span className="mt-0.5"><Chip tone={r.pass ? "good" : "fault"}>{r.pass ? "PASS" : "FAIL"}</Chip></span>
              <div className="min-w-0">
                <div className="mono-num text-[11.5px] text-foreground/90">{r.id} · {r.name}</div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-5">
        <Panel title="Coverage model" subtitle="opcode and scenario bins" scroll={false}>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Assertions" value={`${results.length - failing.length}/${results.length}`} tone={failing.length ? "fault" : "good"} />
              <Metric label="Coverage" value={pct((opcodeCoverage + scenarioCoverage) / 2)} tone="signal" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Opcode bins</span><span className="mono-num normal-case">{covered.length}/{opcodes.length}</span>
              </div>
              <Bar value={opcodeCoverage} tone={opcodeCoverage > 0.8 ? "good" : "warn"} />
              <div className="mt-2 flex flex-wrap gap-1">
                {opcodes.map((m) => (
                  <Chip key={m} tone={(sim.opcodeCoverage.get(m) ?? 0) > 0 ? "good" : "default"}>
                    {m}:{sim.opcodeCoverage.get(m) ?? 0}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Scenario bins</span>
                <span className="mono-num normal-case">{scenarios.filter((s) => s.hit).length}/{scenarios.length}</span>
              </div>
              <Bar value={scenarioCoverage} tone={scenarioCoverage > 0.7 ? "good" : "warn"} />
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {scenarios.map((s) => (
                  <div key={s.name} className="mono-num flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <span className={s.hit ? "text-good" : "text-muted-foreground/50"}>{s.hit ? "✓" : "○"}</span>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Regression suite" subtitle="nightly · riscv-tests derived" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Test</th>
                <th className="px-3 py-2 font-medium">Cycles</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {suites.map((s) => (
                <tr key={s.name} className="border-t border-border/50">
                  <td className="mono-num px-3 py-1.5 text-[11px]">{s.name}</td>
                  <td className="mono-num px-3 py-1.5 text-[11px] text-muted-foreground">{s.cycles.toLocaleString()}</td>
                  <td className="px-3 py-1.5">
                    <Chip tone={s.status === "PASS" ? "good" : s.status === "WARN" ? "warn" : "fault"}>{s.status}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
