import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function ArchitecturePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">System Architecture</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Architecture Overview</h2>
          <p>
            QuantumRISC implements a 5-stage in-order pipeline with a 32-bit RISC-V ISA core. The architecture is
            designed for clarity, correctness, and educational value while maintaining production-grade implementation
            quality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Components</h2>
          <div className="grid gap-4">
            {[
              {
                name: 'Instruction Fetch (IF)',
                desc: 'Fetches instructions from instruction memory based on PC, handles branch prediction',
              },
              {
                name: 'Instruction Decode (ID)',
                desc: 'Decodes RISC-V instructions, extracts immediates, generates control signals',
              },
              {
                name: 'Execute (EX)',
                desc: 'Executes ALU operations, calculates addresses, processes branch conditions',
              },
              {
                name: 'Memory Access (MEM)',
                desc: 'Performs load/store operations, manages cache hierarchy',
              },
              {
                name: 'Write Back (WB)',
                desc: 'Writes results to register file, completes instruction execution',
              },
            ].map((component, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground">{component.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{component.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Characteristics</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Pipeline Stages', value: '5' },
                { metric: 'Base Clock (Simulation)', value: '100 MHz' },
                { metric: 'Instruction Throughput', value: '1 IPC (base)' },
                { metric: 'Register File', value: '32 × 32-bit' },
                { metric: 'Cache (Simulation)', value: '16 KB I-cache, 16 KB D-cache' },
                { metric: 'RISC-V Subset', value: 'RV32I + Extensions' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-4 py-2 font-medium">{row.metric}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">RTL Design</h2>
          <p>
            The RTL is implemented in SystemVerilog with professional practices:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Modular design with clear separation of concerns</li>
            <li>Synthesizable code targeting FPGA and ASIC flows</li>
            <li>Comprehensive formal verification coverage</li>
            <li>Performance-optimized data paths</li>
            <li>Production-ready reset and clock distribution</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Backend Architecture</h2>
          <p>
            The simulation backend provides:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>High-performance cycle-accurate simulation</li>
            <li>WebSocket-based real-time communication</li>
            <li>Comprehensive state tracking and monitoring</li>
            <li>Performance profiling and statistics collection</li>
            <li>Extensible plugin architecture for custom verification</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Frontend Architecture</h2>
          <p>
            The web frontend enables:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Interactive pipeline visualization</li>
            <li>Real-time instruction tracing</li>
            <li>Register and memory state inspection</li>
            <li>Performance metrics and analysis dashboards</li>
            <li>Responsive design for all devices</li>
          </ul>
        </section>
      </article>

      <Pagination
        next={{
          label: 'RTL Architecture',
          href: '/docs/architecture/rtl',
        }}
      />
    </>
  )
}
