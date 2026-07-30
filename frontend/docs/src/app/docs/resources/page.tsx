import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

export default function ResourcesPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Resources' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Design Decisions & Roadmap</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Architecture Design Decisions</h2>
          <p>
            Key decisions shaping QuantumRISC&apos;s architecture and implementation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Design Decisions
          </h2>
          <div className="space-y-4">
            {[
              {
                title: '5-Stage In-Order Pipeline',
                rationale: 'Balances educational clarity with real-world relevance. Demonstrates hazard handling, forwarding, and branch prediction without extreme complexity.',
              },
              {
                title: 'RISC-V ISA',
                rationale: 'Open-source, well-documented, increasingly relevant. Enables compatibility with existing toolchains and educational resources.',
              },
              {
                title: 'SystemVerilog RTL',
                rationale: 'Industry-standard HDL with modern features. Synthesizable to both FPGA and ASIC flows.',
              },
              {
                title: 'WebSocket Real-Time Communication',
                rationale: 'Enables live pipeline visualization and interactive debugging. Low latency for responsive UX.',
              },
              {
                title: 'Cycle-Accurate Simulation',
                rationale: 'Precise modeling enables accurate performance prediction and verification of microarchitectural behavior.',
              },
            ].map((decision, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground mb-2">{decision.title}</h3>
                <p className="text-sm text-muted-foreground italic">"{decision.rationale}"</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Future Roadmap
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Phase 1: Core (Current)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>5-stage pipeline with hazard handling</li>
                <li>Functional simulation and verification</li>
                <li>Basic performance metrics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Phase 2: Enhancement</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Out-of-order execution support</li>
                <li>Advanced branch prediction</li>
                <li>Multi-level cache hierarchy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Phase 3: Scaling</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Multi-core support</li>
                <li>FPGA synthesis targeting</li>
                <li>Hardware tape-out preparation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            Engineering Challenges & Solutions
          </h2>
          <div className="space-y-4">
            {[
              {
                challenge: 'Hazard Detection',
                solution: 'Implemented comprehensive data and control hazard detection with proper forwarding paths',
              },
              {
                challenge: 'Cache Coherency',
                solution: 'Simple cache model with write-through policy for educational clarity',
              },
              {
                challenge: 'Real-Time Visualization',
                solution: 'Optimized WebSocket messages and efficient state diffing',
              },
              {
                challenge: 'Verification Coverage',
                solution: 'Combination of simulation, formal methods, and property-based testing',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-1">{item.challenge}</h3>
                <p className="text-sm text-muted-foreground">✓ {item.solution}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Tradeoffs</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">Aspect</th>
                <th className="px-4 py-2 text-left">Choice</th>
                <th className="px-4 py-2 text-left">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  aspect: 'Simplicity vs Features',
                  choice: 'Prioritized simplicity',
                  rationale: 'Easier to understand and verify',
                },
                {
                  aspect: 'Performance vs Clarity',
                  choice: 'Clarity first',
                  rationale: 'Educational value for architects',
                },
                {
                  aspect: 'Features vs Completion',
                  choice: 'Complete core features',
                  rationale: 'Production-ready foundation',
                },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-4 py-2 font-medium">{row.aspect}</td>
                  <td className="px-4 py-2">{row.choice}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Lessons Learned</h2>
          <div className="space-y-3">
            {[
              'Clear RTL module boundaries are critical for maintainability',
              'Early verification catches fundamental design issues before implementation',
              'Web-based visualization drives immediate understanding of complex behavior',
              'Open-source tools and documentation accelerate development significantly',
              'Comprehensive testing at each stage prevents costly integration issues',
            ].map((lesson, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card/30">
                <span className="text-primary font-bold">→</span>
                <p className="text-sm text-foreground">{lesson}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        next={{
          label: 'FAQ',
          href: '/docs/resources/faq',
        }}
      />
    </>
  )
}
