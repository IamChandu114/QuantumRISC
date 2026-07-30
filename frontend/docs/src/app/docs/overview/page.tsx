import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function OverviewPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Overview' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">QuantumRISC Overview</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Executive Summary</h2>
          <p>
            QuantumRISC is a comprehensive, production-grade CPU architecture implementation built from first principles.
            It demonstrates deep expertise in computer architecture, HDL design, verification methodology, and full-stack
            systems engineering.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Project Vision</h2>
          <p>
            To create a world-class processor design that showcases:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Modern RISC-V ISA implementation with 32-bit core</li>
            <li>5-stage in-order execution pipeline</li>
            <li>Complete RTL design in Verilog/SystemVerilog</li>
            <li>Comprehensive verification and simulation framework</li>
            <li>Full-stack web-based engineering platform</li>
            <li>Professional documentation and API design</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Problem Statement</h2>
          <p>
            Existing CPU architecture references often lack:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Clear end-to-end architecture documentation</li>
            <li>Accessible simulation environments</li>
            <li>Interactive visualization of pipeline behavior</li>
            <li>Integration between simulation and engineering tools</li>
            <li>Modern, professional documentation standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Engineering Goals</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Architecture</h3>
              <p className="text-sm text-muted-foreground">Demonstrate mastery of CPU design principles, ISA design, and microarchitecture optimization</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">RTL Implementation</h3>
              <p className="text-sm text-muted-foreground">Professional-grade Verilog with proper synthesis considerations and simulation efficiency</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verification</h3>
              <p className="text-sm text-muted-foreground">Comprehensive testing including functional, performance, and corner-case verification</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Full-Stack Integration</h3>
              <p className="text-sm text-muted-foreground">Seamless backend simulation engine with modern web frontend</p>
            </div>
          </div>
        </section>
      </article>

      <Pagination
        next={{
          label: 'Project Vision',
          href: '/docs/overview/vision',
        }}
      />
    </>
  )
}
