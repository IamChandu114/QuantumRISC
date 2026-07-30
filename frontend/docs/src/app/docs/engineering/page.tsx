import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function EngineeringPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Engineering' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Engineering & Verification</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Comprehensive Testing Strategy</h2>
          <p>
            QuantumRISC uses a multi-layered verification approach combining simulation, formal methods, and
            property-based testing to ensure correctness and performance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Verification Levels</h2>
          <div className="space-y-4">
            {[
              {
                level: 'Unit Testing',
                scope: 'Individual modules (ALU, hazard detector, cache)',
                methods: ['Component simulation', 'Directed tests', 'Assertion checking'],
              },
              {
                level: 'Integration Testing',
                scope: 'Pipeline interactions and data flow',
                methods: ['Pipeline traces', 'Hazard scenarios', 'Forwarding verification'],
              },
              {
                level: 'System Testing',
                scope: 'Complete CPU executing real programs',
                methods: ['RISC-V test suite', 'Benchmark programs', 'Corner cases'],
              },
              {
                level: 'Performance Verification',
                scope: 'IPC, cache behavior, branch prediction',
                methods: ['Profiling', 'Regression analysis', 'Performance budgets'],
              },
              {
                level: 'Formal Verification',
                scope: 'Critical properties (safety, liveness)',
                methods: ['Theorem proving', 'Model checking', 'Equivalence checking'],
              },
            ].map((test, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground">{test.level}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-2">{test.scope}</p>
                <ul className="list-disc list-inside space-y-1">
                  {test.methods.map((method, j) => (
                    <li key={j} className="text-xs text-muted-foreground">{method}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Coverage Areas</h2>
          <div className="space-y-3">
            {[
              'Instruction execution (all RISC-V RV32I instructions)',
              'Data hazards (RAW, WAW, WAR)',
              'Control flow (branches, jumps, predictions)',
              'Memory operations (load, store, alignment)',
              'Cache operations (hits, misses, replacement)',
              'Edge cases (zero register, overflow, underflow)',
              'Error handling (invalid instructions, exceptions)',
            ].map((coverage, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card/30">
                <span className="text-primary font-bold">✓</span>
                <p className="text-sm text-foreground">{coverage}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-left">Definition</th>
                <th className="px-4 py-2 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'IPC', def: 'Instructions per cycle', target: '~1.5-2.0' },
                { metric: 'Cache Miss Rate', def: 'L1 cache misses per 1000 accesses', target: '<5%' },
                { metric: 'Branch Accuracy', def: 'Correct predictions / total branches', target: '>75%' },
                { metric: 'Hazard Stalls', def: 'Cycles stalled due to hazards', target: '<20%' },
                { metric: 'Memory Latency', def: 'Average load completion time', target: '~5 cycles' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-4 py-2 font-medium">{row.metric}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{row.def}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulation Environment</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`Test Framework:
├── Test Runner
│   ├── Unit test executor
│   ├── Integration test runner
│   └── Performance regression test
├── Test Vectors
│   ├── Instruction stream generator
│   ├── Known good results database
│   └── Random test case generator
├── Verification Monitor
│   ├── State comparison
│   ├── Assertion engine
│   └── Coverage tracker
└── Report Generator
    ├── Pass/fail summary
    ├── Coverage reports
    └── Performance analysis

Continuous Integration:
- Automated test runs on commits
- Performance regression detection
- Coverage trending
- Automated regression bug detection`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Known Limitations & Future Work</h2>
          <div className="space-y-3">
            {[
              { title: 'Out-of-Order Execution', desc: 'Current design is in-order; OOO planned for Phase 2' },
              { title: 'Speculative Execution', desc: 'No speculation beyond branch prediction' },
              { title: 'Multi-Core', desc: 'Single-core only; multi-core support in roadmap' },
              { title: 'Virtual Memory', desc: 'No TLB or virtual addressing support' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card/30">
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        next={{
          label: 'Instruction Lifecycle',
          href: '/docs/engineering/instruction',
        }}
      />
    </>
  )
}
