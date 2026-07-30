import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function BackendPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'Backend' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Backend Architecture</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            The backend is a high-performance simulation engine that models QuantumRISC&apos;s behavior cycle-accurately.
            It manages program execution, state tracking, and provides real-time data to the frontend.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Core Components</h2>
          <div className="space-y-4">
            {[
              {
                name: 'Simulator Engine',
                resp: 'Core simulation loop managing cycle-by-cycle execution',
              },
              {
                name: 'Memory System',
                resp: 'Instruction/data cache simulation and memory hierarchy',
              },
              {
                name: 'Pipeline Model',
                resp: 'Accurate 5-stage pipeline with hazard detection',
              },
              {
                name: 'Instruction Decoder',
                resp: 'RISC-V instruction parsing and execution dispatch',
              },
              {
                name: 'State Manager',
                resp: 'Tracks all processor state for inspection',
              },
              {
                name: 'Performance Monitor',
                resp: 'Collects metrics: IPC, cache misses, branch mispredicts',
              },
            ].map((component, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground">{component.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{component.resp}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <tbody>
              {[
                { component: 'Runtime', tech: 'Node.js with TypeScript' },
                { component: 'Backend Framework', tech: 'Express.js' },
                { component: 'Real-time Communication', tech: 'WebSocket (ws library)' },
                { component: 'State Management', tech: 'In-memory with differential updates' },
                { component: 'Performance Profiling', tech: 'Native Node.js profiling APIs' },
              ].map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border ${i % 2 ? 'bg-card/30' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{row.component}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Simulation Flow</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`1. Initialize()
   ├─ Allocate memory
   ├─ Reset pipeline
   └─ Initialize registers

2. LoadProgram(binary)
   ├─ Parse RISC-V instructions
   ├─ Load into instruction memory
   └─ Set PC = 0

3. SimulationLoop()
   ├─ Fetch instruction
   ├─ Decode and dispatch
   ├─ Execute on pipeline
   ├─ Update memory
   ├─ Write results
   ├─ Update state
   ├─ Check breakpoints
   └─ Send to frontend

4. Collect metrics
   ├─ Cycle count
   ├─ IPC
   ├─ Cache statistics
   └─ Branch prediction`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Optimizations</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Cached instruction decode for common patterns</li>
            <li>Lazy evaluation of pipeline state updates</li>
            <li>Efficient state diffing for WebSocket messages</li>
            <li>Parallel cache simulation for independent operations</li>
            <li>Profiling-guided optimization of hot paths</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Memory Model</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Instruction Memory</h3>
              <p className="text-sm text-muted-foreground">32 KB simulated I-cache with 32-byte lines (configurable)</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Memory</h3>
              <p className="text-sm text-muted-foreground">32 KB simulated D-cache, 1 MB main memory (configurable)</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cache Policy</h3>
              <p className="text-sm text-muted-foreground">
                Write-through with write-allocate for D-cache, LRU replacement policy
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Extension Points</h2>
          <div className="space-y-3">
            {[
              'Custom instruction handlers for ISA extensions',
              'Plugin architecture for verification modules',
              'Configurable memory hierarchy',
              'Extensible performance metrics collection',
              'Custom state inspection hooks',
            ].map((point, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card/30">
                <span className="text-primary font-bold">→</span>
                <p className="text-sm text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'RTL',
          href: '/docs/architecture/rtl',
        }}
        next={{
          label: 'Frontend Architecture',
          href: '/docs/architecture/frontend',
        }}
      />
    </>
  )
}
