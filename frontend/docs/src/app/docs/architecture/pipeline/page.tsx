import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function PipelinePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'Pipeline' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Pipeline Flow</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5-Stage Pipeline Overview</h2>
          <p>
            QuantumRISC implements a classic 5-stage in-order pipeline that balances educational clarity with
            real-world relevance. Each stage is cleanly separated with pipeline registers between them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pipeline Stages</h2>
          <div className="space-y-4">
            {[
              {
                stage: 'IF - Instruction Fetch',
                tasks: [
                  'Read PC (Program Counter)',
                  'Fetch instruction from I-cache',
                  'Update PC (PC ← PC + 4 or branch target)',
                  'Check for branch prediction',
                ],
              },
              {
                stage: 'ID - Instruction Decode',
                tasks: [
                  'Decode instruction opcode and fields',
                  'Read source registers from register file',
                  'Generate control signals',
                  'Compute immediate values',
                  'Check for data hazards',
                ],
              },
              {
                stage: 'EX - Execute',
                tasks: [
                  'Execute ALU operations',
                  'Calculate addresses for load/store',
                  'Evaluate branch conditions',
                  'Forward operands from previous stages',
                ],
              },
              {
                stage: 'MEM - Memory Access',
                tasks: [
                  'Access data cache for load/store',
                  'Perform D-cache lookups',
                  'Handle memory hierarchy',
                  'Stall on cache miss',
                ],
              },
              {
                stage: 'WB - Write Back',
                tasks: [
                  'Write ALU results to register file',
                  'Write load data to register file',
                  'Complete instruction execution',
                ],
              },
            ].map((stage, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground mb-3">{stage.stage}</h3>
                <ul className="space-y-1">
                  {stage.tasks.map((task, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span> {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hazard Handling</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2">Data Hazards (RAW)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Read-After-Write dependencies detected and resolved by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>EX/MEM forwarding for immediate resolution</li>
                <li>MEM/WB forwarding for delayed writes</li>
                <li>Stall insertion when forwarding impossible (load-use)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2">Control Hazards (Branches)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Branch resolution and pipeline recovery:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Static branch prediction (forward/backward assumed)</li>
                <li>Pipeline flush on misprediction</li>
                <li>3-cycle branch penalty (resolved in MEM stage)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold text-foreground mb-2">Structural Hazards</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Resource conflicts managed by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Register file with separate read/write ports</li>
                <li>Cache arbitration for I-cache and D-cache</li>
                <li>Priority schemes for memory access</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pipeline Forwarding</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`Forwarding Paths:

┌─────────────┬─────────────┬──────────────┐
│   From      │   To Stage  │  Condition   │
├─────────────┼─────────────┼──────────────┤
│ EX/MEM Reg  │ EX Stage    │ ALU forward  │
│ MEM/WB Reg  │ EX Stage    │ ALU forward  │
│ MEM/WB Reg  │ ID Stage    │ Branch cond  │
│ WB Reg File │ Any ahead   │ Direct use   │
└─────────────┴─────────────┴──────────────┘

Stall Conditions:

Load-Use Hazard:
  IF → ID (load) → EX → MEM → WB
        ID (op using load dest) → stall

Branch Mispredict:
  IF (wrong path) → stall all younger instructions
  Flush: IF, ID, EX stages → retry from correct PC`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Characteristics</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">Scenario</th>
                <th className="px-4 py-2 text-left">CPI Impact</th>
              </tr>
            </thead>
            <tbody>
              {[
                { scenario: 'No hazards (ideal)', cpi: '1.0' },
                { scenario: 'ALU-to-ALU dependency', cpi: '1.0 (forwarded)' },
                { scenario: 'Load-use hazard', cpi: '1 + 1 = 2' },
                { scenario: 'Branch misprediction', cpi: '+3' },
                { scenario: 'Cache miss', cpi: '+20 (typical)' },
                { scenario: 'Mixed workload', cpi: '~1.8-2.2' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-4 py-2 font-medium">{row.scenario}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.cpi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example Execution Trace</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`Cycle 1: add r1, r2, r3
  IF: fetch "add r1, r2, r3"
  
Cycle 2: lw r4, 0(r1)
  IF: fetch "lw r4, 0(r1)"
  ID: decode add, read r2, r3
  
Cycle 3: mul r5, r4, r6  (STALL - load-use hazard)
  IF: fetch "mul r5, r4, r6"
  ID: decode lw
  EX: compute addr = r1 + 0
  
Cycle 4: (STALL continues)
  IF: (no new instruction)
  ID: (stall)
  MEM: lw from cache, result to r4
  
Cycle 5: (Hazard resolved)
  IF: fetch "mul r5, r4, r6"
  ID: decode mul
  EX: add computes r1←r2+r3
  WB: lw writes r4←data
  
Cycle 6:
  MEM: mul computes r5←r4*r6
  EX: lw (now with r1 value)
  
Result: 6 cycles for 4 instructions (1.5 CPI due to load-use)`}</code>
          </pre>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Frontend',
          href: '/docs/architecture/frontend',
        }}
      />
    </>
  )
}
