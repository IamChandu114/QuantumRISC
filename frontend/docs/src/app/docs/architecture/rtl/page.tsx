import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function RTLPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'RTL' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">RTL Architecture</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            The QuantumRISC RTL is implemented in SystemVerilog with professional practices for synthesis, simulation,
            and verification. The design is modular, synthesizable, and optimized for both FPGA and ASIC flows.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Module Hierarchy</h2>
          <div className="bg-card border border-border rounded-lg p-6 font-mono text-xs space-y-2">
            <div>cpu_core</div>
            <div className="ml-4">├── fetch_stage</div>
            <div className="ml-4">├── decode_stage</div>
            <div className="ml-4">├── execute_stage</div>
            <div className="ml-4">├── memory_stage</div>
            <div className="ml-4">├── writeback_stage</div>
            <div className="ml-4">├── register_file (32×32 bits)</div>
            <div className="ml-4">├── alu (arithmetic/logic unit)</div>
            <div className="ml-4">├── control_unit</div>
            <div className="ml-4">├── hazard_detector</div>
            <div className="ml-4">├── forwarding_unit</div>
            <div className="ml-4">├── instruction_cache</div>
            <div className="ml-4">└── data_cache</div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key RTL Features</h2>
          <div className="space-y-3">
            {[
              { title: 'Hazard Detection', desc: 'RAW, WAW, WAR hazard detection with stall generation' },
              {
                title: 'Data Forwarding',
                desc: 'EX/MEM and MEM/WB forwarding to minimize stalls',
              },
              {
                title: 'Pipeline Control',
                desc: 'Efficient pipeline flush and stall mechanisms',
              },
              {
                title: 'Cache Integration',
                desc: 'Proper memory arbitration and cache control signals',
              },
              {
                title: 'Reset & Initialization',
                desc: 'Clean reset sequences and initialization logic',
              },
            ].map((feature, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card/30">
                <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Synthesis Considerations</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Synchronous design with single clock domain (easily extended to multi-clock)</li>
            <li>Proper reset distribution for reliable operation</li>
            <li>No latches (all sequential logic uses flip-flops)</li>
            <li>Timing-friendly critical paths identified and optimized</li>
            <li>Compatible with standard EDA tools (Design Compiler, Vivado, etc.)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example RTL Snippet</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`// Hazard Detection Unit
always_comb begin
  if ((id_regrs1 == ex_regwd) && ex_regwrite && (id_regrs1 != 0)) begin
    forward_a = 2'b10;  // Forward from EX
  end else if ((id_regrs1 == mem_regwd) && mem_regwrite && (id_regrs1 != 0)) begin
    forward_a = 2'b01;  // Forward from MEM
  end else begin
    forward_a = 2'b00;  // No forward
  end
end

// Stall generation
assign stall = (id_is_load && 
                ((id_regrd == if_regrs1) || (id_regrd == if_regrs2))) ? 1 : 0;`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Verification</h2>
          <div className="space-y-3">
            {[
              'Comprehensive UVM testbenches for each module',
              'Formal verification of critical properties',
              'RTL/gate-level equivalence checking',
              'Post-synthesis timing simulation',
              'Coverage-driven testing',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card/30">
                <span className="text-primary font-bold">✓</span>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Architecture',
          href: '/docs/architecture',
        }}
        next={{
          label: 'Backend Architecture',
          href: '/docs/architecture/backend',
        }}
      />
    </>
  )
}
