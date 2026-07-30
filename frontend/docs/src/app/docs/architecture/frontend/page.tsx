import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function FrontendPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'Frontend' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Frontend Architecture</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            The frontend provides an interactive, real-time interface for observing and controlling the QuantumRISC
            simulator. Built with modern web technologies, it offers professional visualization and comprehensive state
            inspection capabilities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <tbody>
              {[
                { layer: 'Framework', tech: 'React 19 with Server Components' },
                { layer: 'Styling', tech: 'Tailwind CSS v4 with shadcn/ui' },
                { layer: 'Real-time', tech: 'WebSocket client with auto-reconnect' },
                { layer: 'Visualization', tech: 'Recharts for charts, custom SVG diagrams' },
                { layer: 'Build', tech: 'Next.js 16 with TypeScript' },
              ].map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border ${i % 2 ? 'bg-card/30' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{row.layer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
          <div className="space-y-4">
            {[
              {
                feature: 'Pipeline Visualization',
                desc: 'Real-time 5-stage pipeline diagram showing instructions in flight',
              },
              {
                feature: 'Register Inspector',
                desc: 'View all 32 registers with real-time updates and highlighting',
              },
              {
                feature: 'Memory Browser',
                desc: 'Navigate instruction/data memory with cache state visualization',
              },
              {
                feature: 'Performance Dashboard',
                desc: 'IPC graphs, cache miss rates, branch prediction accuracy',
              },
              {
                feature: 'Instruction Trace',
                desc: 'Historical log of executed instructions with full details',
              },
              {
                feature: 'Simulation Controls',
                desc: 'Step, run, pause, reset with breakpoint support',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <h3 className="font-semibold text-foreground">{item.feature}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Component Architecture</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`App
├── Layout
│   ├── Header (title, controls, theme toggle)
│   ├── Sidebar (navigation, quick stats)
│   └── StatusBar (connection status, cycle count)
├── MainView
│   ├── PipelineVisualizer
│   │   ├── FetchStage
│   │   ├── DecodeStage
│   │   ├── ExecuteStage
│   │   ├── MemoryStage
│   │   └── WriteBackStage
│   ├── StatePanel (tabs)
│   │   ├── RegisterView
│   │   ├── MemoryView
│   │   └── CacheView
│   └── PerformanceDashboard
│       ├── IPCGraph
│       ├── CacheMissChart
│       └── BranchPredictionStats
└── ControlPanel
    ├── ProgramLoader
    ├── SimulationControls
    └── BreakpointManager`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">State Management</h2>
          <p className="mb-4 text-sm">
            Uses React hooks and Context API for efficient state management with WebSocket integration:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>SimulatorContext: Global simulator state and control</li>
            <li>ProcessorState: Real-time pipeline and register state</li>
            <li>PerformanceMetrics: Cycle counts and performance data</li>
            <li>UIState: UI preferences (dark mode, expanded panels, etc.)</li>
            <li>WebSocket hook: Handles real-time updates with fallback</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Responsive Design</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{"Mobile (< 768px)"}</h3>
              <p className="text-sm text-muted-foreground">
                Stacked layout with collapsible panels, swipeable views for pipeline stages
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Tablet (768px - 1024px)</h3>
              <p className="text-sm text-muted-foreground">
                Two-column layout with sidebar and main view side-by-side
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{"Desktop (> 1024px)"}</h3>
              <p className="text-sm text-muted-foreground">
                Full three-column layout with pipeline, state panels, and metrics dashboard
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dark/Light Mode</h2>
          <p>
            Full dark mode support using Tailwind CSS with next-themes. Seamlessly switches between themes with
            professional color palettes optimized for readability and contrast.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Considerations</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Virtual scrolling for large memory views</li>
            <li>Memoized components to prevent unnecessary re-renders</li>
            <li>Efficient WebSocket message parsing</li>
            <li>Canvas-based rendering for pipeline diagrams</li>
            <li>Progressive enhancement for graceful degradation</li>
          </ul>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Backend',
          href: '/docs/architecture/backend',
        }}
        next={{
          label: 'Pipeline Flow',
          href: '/docs/architecture/pipeline',
        }}
      />
    </>
  )
}
