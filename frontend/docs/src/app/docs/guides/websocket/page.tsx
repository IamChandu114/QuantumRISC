import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function WebSocketPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'WebSocket' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">WebSocket Documentation</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            QuantumRISC uses WebSocket for real-time, bidirectional communication between the backend simulator and
            frontend UI. This enables live pipeline visualization and responsive interactive debugging.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connection</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>
              {'// Connect to simulator WebSocket\n'}
              {'const ws = new WebSocket(&apos;ws://localhost:3000/api/simulator/stream&apos;);\n\n'}
              {'ws.onopen = () => {\n'}
              {'  console.log(&apos;Connected to simulator&apos;);\n'}
              {'  ws.send(JSON.stringify({ '}
              {'type: &apos;init&apos;, sessionId: &apos;abc123&apos; '}
              {'}));\n'}
              {'};\n\n'}
              {'ws.onmessage = (event) => {\n'}
              {'  const message = JSON.parse(event.data);\n'}
              {'  handleSimulatorUpdate(message);\n'}
              {'};\n\n'}
              {'ws.onerror = (error) => {\n'}
              {'  console.error(&apos;WebSocket error:&apos;, error);\n'}
              {'};\n\n'}
              {'ws.onclose = () => {\n'}
              {'  console.log(&apos;Disconnected from simulator&apos;);\n'}
              {'};'}
            </code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Message Protocol</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Client → Server</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>
                  {'{' + '\n'}
                  &quot;type&quot;: &quot;step&quot; | &quot;run&quot; | &quot;pause&quot; | &quot;reset&quot;,{'\n'}
                  &quot;sessionId&quot;: &quot;string&quot;,{'\n'}
                  &quot;maxCycles&quot;: number (optional),{'\n'}
                  &quot;breakpoints&quot;: number[] (optional){'\n'}
                  {'}'}
                </code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Server → Client</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>
                  {'{' + '\n'}
                  &quot;type&quot;: &quot;state_update&quot;,{'\n'}
                  &quot;cycle&quot;: number,{'\n'}
                  &quot;state&quot;: {'{' + '\n'}
                  &quot;pc&quot;: number,{'\n'}
                  &quot;registers&quot;: number[],{'\n'}
                  &quot;pipeline&quot;: PipelineState,{'\n'}
                  &quot;memory&quot;: MemoryDelta{'\n'}
                  {'}' + ',' + '\n'}
                  &quot;metrics&quot;: {'{' + '\n'}
                  &quot;ipc&quot;: number,{'\n'}
                  &quot;cacheMissRate&quot;: number,{'\n'}
                  &quot;branchAccuracy&quot;: number{'\n'}
                  {'}' + '\n'}
                  {'}'}
                </code>
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Message Types</h2>
          <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
            <thead className="bg-card border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Direction</th>
                <th className="px-3 py-2 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'init', dir: 'C→S', purpose: 'Initialize simulation session' },
                { type: 'step', dir: 'C→S', purpose: 'Execute single cycle' },
                { type: 'run', dir: 'C→S', purpose: 'Run until breakpoint/completion' },
                { type: 'pause', dir: 'C→S', purpose: 'Pause running simulation' },
                { type: 'reset', dir: 'C→S', purpose: 'Reset to initial state' },
                { type: 'state_update', dir: 'S→C', purpose: 'Send current state to client' },
                { type: 'breakpoint_hit', dir: 'S→C', purpose: 'Notify breakpoint reached' },
                { type: 'error', dir: 'S→C', purpose: 'Report error to client' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-card/50">
                  <td className="px-3 py-2 font-mono">{row.type}</td>
                  <td className="px-3 py-2">{row.dir}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example: Real-Time Streaming</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>
              {'// Listen for state updates\n'}
              {'ws.onmessage = (event) => {\n'}
              {'  const msg = JSON.parse(event.data);\n\n'}
              {'  if (msg.type === &apos;state_update&apos;) {\n'}
              {'    updatePipeline(msg.state.pipeline);\n'}
              {'    updateRegisters(msg.state.registers);\n\n'}
              {'    updateMetrics({\n'}
              {'      cycle: msg.cycle,\n'}
              {'      ipc: msg.metrics.ipc,\n'}
              {'      cacheMissRate: msg.metrics.cacheMissRate\n'}
              {'    });\n'}
              {'  }\n\n'}
              {'  if (msg.type === &apos;breakpoint_hit&apos;) {\n'}
              {'    console.log(&apos;Breakpoint at PC:&apos;, msg.pc);\n'}
              {'    updateUI({ '}
              {'paused: true '}
              {'});\n'}
              {'  }\n\n'}
              {'  if (msg.type === &apos;error&apos;) {\n'}
              {'    showError(msg.message);\n'}
              {'  }\n'}
              {'};\n\n'}
              {'function runSimulation() {\n'}
              {'  ws.send(JSON.stringify({\n'}
              {'    type: &apos;run&apos;,\n'}
              {'    sessionId: sessionId,\n'}
              {'    maxCycles: 10000\n'}
              {'  }));\n'}
              {'}'}
            </code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Considerations</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Differential state updates reduce message size by 70-90%</li>
            <li>Messages sent at 60Hz for smooth visualization</li>
            <li>Compression enabled for large memory dumps</li>
            <li>Client-side caching of unchanged state</li>
            <li>Configurable update frequency for performance</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>
              {'{' + '\n'}
              &quot;type&quot;: &quot;error&quot;,{'\n'}
              &quot;code&quot;: &quot;INVALID_STATE&quot; | &quot;SESSION_NOT_FOUND&quot; | &quot;DECODE_ERROR&quot;,{'\n'}
              &quot;message&quot;: &quot;Human-readable error description&quot;,{'\n'}
              &quot;details&quot;: {'{' + '\n'}
              &quot;pc&quot;: 0x1000,{'\n'}
              &quot;instruction&quot;: &quot;0x12345678&quot;{'\n'}
              {'}' + '\n'}
              {'}'}
            </code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Reconnection Strategy</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>
              {'class SimulatorClient ' + '{' + '\n'}
              {'  constructor(url) ' + '{' + '\n'}
              {'    this.url = url;\n'}
              {'    this.reconnectInterval = 1000;\n'}
              {'    this.maxReconnectAttempts = 5;\n'}
              {'    this.attempts = 0;\n'}
              {'    this.connect();\n'}
              {'  ' + '}\n\n'}
              {'  connect() ' + '{' + '\n'}
              {'    this.ws = new WebSocket(this.url);\n\n'}
              {'    this.ws.onopen = () => ' + '{' + '\n'}
              {'      this.attempts = 0;\n'}
              {'      this.onConnected();\n'}
              {'    ' + '}' + ';\n\n'}
              {'    this.ws.onclose = () => ' + '{' + '\n'}
              {'      if (this.attempts < this.maxReconnectAttempts) ' + '{' + '\n'}
              {'        this.attempts++;\n'}
              {'        setTimeout(() => this.connect(),\n'}
              {'                   this.reconnectInterval * this.attempts);\n'}
              {'      ' + '}\n'}
              {'    ' + '}' + ';\n'}
              {'  ' + '}\n'}
              {'}'}
            </code>
          </pre>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'API Documentation',
          href: '/docs/guides/api',
        }}
      />
    </>
  )
}
