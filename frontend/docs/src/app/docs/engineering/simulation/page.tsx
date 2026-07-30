import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function SimulationPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Engineering', href: '/docs/engineering' },
          { label: 'Simulation Engine' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Simulation Engine</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            The QuantumRISC simulation engine is a high-performance, cycle-accurate model of the complete CPU. It
            accurately models all pipeline behavior, cache interactions, and performance characteristics.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulation Architecture</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`SimulationEngine
├── CPU Model
│   ├── Pipeline Stages (5)
│   ├── Register File (32×32)
│   ├── Control Unit
│   ├── Hazard Detector
│   └── Forwarding Unit
├── Memory System
│   ├── Instruction Cache
│   ├── Data Cache
│   ├── Write Buffer
│   └── Main Memory
├── Performance Monitor
│   ├── Cycle Counter
│   ├── Instruction Counter
│   ├── Cache Statistics
│   ├── Branch Prediction Stats
│   └── Performance Event Counters
└── State Manager
    ├── Current State Snapshot
    ├── History Buffer
    ├── Checkpoints
    └── Diff Generator`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulation Cycle</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`For each cycle:
  1. Fetch Stage
     ├─ Read PC
     ├─ Access I-cache
     ├─ Fetch instruction
     └─ Update PC (PC ← PC+4 or branch target)

  2. Decode Stage
     ├─ Decode instruction
     ├─ Read register file
     ├─ Generate control signals
     ├─ Check hazards
     └─ Insert stalls if needed

  3. Execute Stage
     ├─ Apply forwarding
     ├─ ALU operation
     ├─ Branch condition evaluation
     └─ Address calculation

  4. Memory Stage
     ├─ Cache access (load/store)
     ├─ Memory arbitration
     └─ Stall on miss

  5. Writeback Stage
     ├─ Register file write
     ├─ Instruction completion
     └─ Performance counter update

  6. Post-cycle
     ├─ Update pipeline registers
     ├─ Collect metrics
     ├─ Check breakpoints
     └─ Send state to frontend`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Optimizations</h2>
          <div className="space-y-3">
            {[
              {
                optimization: 'Instruction Cache',
                benefit: 'Reduces fetch latency from 20→1 cycles on hit',
              },
              {
                optimization: 'Data Forwarding',
                benefit: 'Eliminates most RAW hazard stalls',
              },
              {
                optimization: 'Branch Prediction',
                benefit: 'Reduces average branch penalty from 3→1 cycles',
              },
              {
                optimization: 'Lazy Evaluation',
                benefit: 'Only updates state when needed',
              },
              {
                optimization: 'Delta Updates',
                benefit: 'Reduces state transmission by 90%',
              },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card/30">
                <h3 className="font-semibold text-sm text-foreground">{item.optimization}</h3>
                <p className="text-xs text-muted-foreground mt-1">→ {item.benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cache Simulation</h2>
          <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left">Property</th>
                <th className="px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {[
                { prop: 'Size (I/D)', val: '32 KB configurable' },
                { prop: 'Line Size', val: '32 bytes' },
                { prop: 'Associativity', val: '4-way' },
                { prop: 'Replacement', val: 'LRU' },
                { prop: 'Write Policy', val: 'Write-through' },
                { prop: 'Hit Latency', val: '1 cycle' },
                { prop: 'Miss Latency', val: '20 cycles (memory)' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-3 py-2">{row.prop}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics Collection</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`PerformanceCounters:
├── cycle_count: Total cycles executed
├── instruction_count: Total instructions committed
├── branch_count: Total branch instructions
├── branch_misses: Incorrect branch predictions
├── i_cache_hits: I-cache hits
├── i_cache_misses: I-cache misses
├── d_cache_hits: D-cache hits
├── d_cache_misses: D-cache misses
├── data_hazard_stalls: Cycles lost to data hazards
├── control_hazard_stalls: Cycles lost to branches
└── structural_stalls: Cycles lost to resources

Derived Metrics:
├── IPC = instruction_count / cycle_count
├── I-cache hit rate = i_cache_hits / (i_cache_hits + i_cache_misses)
├── D-cache hit rate = d_cache_hits / (d_cache_hits + d_cache_misses)
├── Branch accuracy = (branch_count - branch_misses) / branch_count
└── Stall ratio = (data_hazard_stalls + control_hazard_stalls) / cycle_count`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Debugging Features</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Cycle-by-cycle state snapshots for inspection</li>
            <li>Instruction history with full trace information</li>
            <li>Breakpoint support at program counter</li>
            <li>Watchpoint support on memory locations</li>
            <li>Register value change logging</li>
            <li>Pipeline state visualization at each stage</li>
            <li>Cache replacement tracking</li>
            <li>Performance profiling data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulation Modes</h2>
          <div className="space-y-3">
            {[
              { mode: 'Step Mode', desc: 'Execute single cycle, pause for inspection' },
              { mode: 'Run Mode', desc: 'Execute until breakpoint or completion' },
              { mode: 'Trace Mode', desc: 'Log every instruction and state change' },
              { mode: 'Profile Mode', desc: 'Collect performance metrics' },
              { mode: 'Debug Mode', desc: 'Detailed logging and state inspection' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card/30">
                <h3 className="font-semibold text-sm text-foreground">{item.mode}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Instruction Lifecycle',
          href: '/docs/engineering/instruction',
        }}
      />
    </>
  )
}
