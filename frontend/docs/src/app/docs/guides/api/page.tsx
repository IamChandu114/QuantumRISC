import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function APIPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'API' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">API Documentation</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">REST API Endpoints</h2>
          <p>The QuantumRISC simulator exposes a comprehensive REST API for program execution and state inspection.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Core Endpoints</h2>

          <div className="space-y-6">
            {[
              {
                method: 'POST',
                endpoint: '/api/simulator/initialize',
                desc: 'Initialize a new simulation session',
                params: ['config: SimulationConfig'],
                returns: 'sessionId: string',
              },
              {
                method: 'POST',
                endpoint: '/api/simulator/load-program',
                desc: 'Load a RISC-V program into instruction memory',
                params: ['sessionId: string', 'program: Uint8Array'],
                returns: 'success: boolean',
              },
              {
                method: 'POST',
                endpoint: '/api/simulator/step',
                desc: 'Execute a single cycle',
                params: ['sessionId: string'],
                returns: 'state: ProcessorState',
              },
              {
                method: 'POST',
                endpoint: '/api/simulator/run',
                desc: 'Run until breakpoint or completion',
                params: ['sessionId: string', 'maxCycles: number'],
                returns: 'results: ExecutionResults',
              },
              {
                method: 'GET',
                endpoint: '/api/simulator/state/:sessionId',
                desc: 'Get current processor state',
                params: ['sessionId: string'],
                returns: 'state: ProcessorState',
              },
            ].map((endpoint, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-mono font-semibold rounded ${
                    endpoint.method === 'GET' 
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-green-500/20 text-green-600 dark:text-green-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-foreground">{endpoint.endpoint}</code>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{endpoint.desc}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">Parameters:</span>
                    <ul className="list-disc list-inside text-muted-foreground mt-1">
                      {endpoint.params.map((param, j) => (
                        <li key={j}>{param}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Returns:</span>
                    <p className="text-muted-foreground mt-1">{endpoint.returns}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example Request</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`// Initialize simulation
const response = await fetch('/api/simulator/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      clockFrequency: 100000000,
      cacheSize: 16384,
      verbosity: 'detailed'
    }
  })
});

const { sessionId } = await response.json();
console.log('Session created:', sessionId);`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">State Structure</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`interface ProcessorState {
  pc: number;                    // Program counter
  registers: number[];           // 32 x 32-bit registers
  memory: Uint8Array;           // Main memory
  pipeline: PipelineState;      // 5-stage pipeline
  cacheStats: CacheStatistics;  // I/D cache stats
  cycle: number;                // Total cycles executed
}

interface PipelineState {
  if: InstructionFetch;
  id: InstructionDecode;
  ex: Execute;
  mem: MemoryAccess;
  wb: WriteBack;
}`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="mb-4 text-sm">All API responses follow a standard format:</p>
            <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
              <code>{`{
  "success": boolean,
  "data": T | null,
  "error": ErrorResponse | null
}

interface ErrorResponse {
  code: string;
  message: string;
  details: Record<string, unknown>;
}`}</code>
            </pre>
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Guides',
          href: '/docs/guides',
        }}
        next={{
          label: 'WebSocket Documentation',
          href: '/docs/guides/websocket',
        }}
      />
    </>
  )
}
