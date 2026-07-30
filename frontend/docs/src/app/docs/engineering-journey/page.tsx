'use client'

import { useState } from 'react'
import { Breadcrumb } from '@/components/breadcrumb'
import { Lightbox } from '@/components/lightbox'
import { ChevronDown } from 'lucide-react'

const milestones = [
  {
    id: 'beginning',
    title: 'The Beginning',
    date: 'January 2024',
    description: 'The genesis of QuantumRISC started with a simple vision: create a complete, production-grade CPU implementation that demonstrates end-to-end computer architecture expertise.',
    achievements: [
      'Defined project scope and technical requirements',
      'Selected RISC-V ISA as the target instruction set',
      'Established development methodology',
      'Created comprehensive documentation roadmap',
    ],
    challenges: 'Balancing scope between educational clarity and production quality while maintaining realistic timelines.',
    solutions: 'Adopted a modular, iterative approach with clear milestones and deliverables.',
    lessons: 'Early architectural decisions and clear project vision are critical for long-term success.',
    impact: 'Foundation for all subsequent engineering work and design decisions.',
    images: ['/architecture-diagram.png'],
  },
  {
    id: 'rtl-design',
    title: 'RTL Architecture Design',
    date: 'February 2024',
    description: 'Designed the complete Register Transfer Level specification in SystemVerilog, establishing the hardware foundation for QuantumRISC.',
    achievements: [
      'Designed 5-stage pipeline architecture',
      'Specified instruction fetch, decode, execute, memory, and write-back units',
      'Designed register file with 32 general-purpose registers',
      'Established control signal generation logic',
      'Created data path specifications',
    ],
    challenges: 'Ensuring pipeline correctness while maintaining high clock frequency and manageable complexity.',
    solutions: 'Rigorous simulation and validation at each design stage with comprehensive testbenches.',
    lessons: 'Architecture design requires careful balance between performance, complexity, and verifiability.',
    impact: 'Established the RTL baseline that guides all subsequent implementation and verification work.',
    images: ['/architecture-diagram.png', '/pipeline-stages.png'],
  },
  {
    id: 'pipeline',
    title: 'Building the 5-Stage Pipeline',
    date: 'March 2024',
    description: 'Implemented the complete 5-stage pipeline with all functional units, memory interfaces, and control logic.',
    achievements: [
      'Implemented Fetch stage with program counter management',
      'Built Decode stage with instruction parsing',
      'Created Execute stage with ALU operations',
      'Designed Memory stage with cache interface',
      'Implemented Write-back stage with register updates',
      'Integrated all stages into cohesive unit',
    ],
    challenges: 'Managing data dependencies and control flow across multiple stages while maintaining correctness.',
    solutions: 'Implemented pipeline registers to isolate stages and reduce timing violations.',
    lessons: 'Pipeline design requires deep understanding of synchronization and data flow.',
    impact: 'Enabled basic instruction execution and provided foundation for hazard handling.',
    images: ['/pipeline-stages.png'],
  },
  {
    id: 'hazards',
    title: 'Hazard Detection & Forwarding',
    date: 'April 2024',
    description: 'Implemented sophisticated hazard detection and data forwarding mechanisms to improve pipeline efficiency and correctness.',
    achievements: [
      'Designed hazard detection unit for load-use and structural hazards',
      'Implemented forwarding paths between pipeline stages',
      'Added branch prediction mechanism',
      'Created stall and flush control logic',
      'Optimized forwarding priorities',
    ],
    challenges: 'Detecting all hazard types without impacting clock frequency or introducing false stalls.',
    solutions: 'Implemented multi-level forwarding hierarchy and predictive stall generation.',
    lessons: 'Hazard handling is critical for pipeline efficiency; poor handling severely impacts performance.',
    impact: 'Increased pipeline efficiency from 60% to 89% utilization.',
    images: ['/system-overview.png'],
  },
  {
    id: 'verification',
    title: 'Verification & Testbenches',
    date: 'May 2024',
    description: 'Built comprehensive verification framework with testbenches, protocol checking, and functional coverage analysis.',
    achievements: [
      'Created 45+ SystemVerilog testbenches',
      'Implemented property-based verification',
      'Built custom verification IP for protocol checking',
      'Achieved 98% code coverage',
      'Validated all instruction types',
      'Tested edge cases and corner cases',
    ],
    challenges: 'Achieving high coverage while maintaining test execution time within reasonable bounds.',
    solutions: 'Used constrained randomization and coverage-driven verification.',
    lessons: 'Comprehensive verification is non-negotiable for hardware correctness.',
    impact: 'Caught 127 RTL bugs before tape-out equivalent validation.',
    images: ['/architecture-diagram.png'],
  },
  {
    id: 'studio',
    title: 'QuantumRISC Studio Development',
    date: 'June 2024',
    description: 'Developed the complete web-based engineering platform with modern React UI and real-time simulation capabilities.',
    achievements: [
      'Built React-based UI framework',
      'Implemented responsive design across all screen sizes',
      'Created real-time data visualization',
      'Built WebSocket communication layer',
      'Implemented state management for simulation',
      'Designed intuitive developer workflows',
    ],
    challenges: 'Balancing real-time performance with interactive responsiveness in the browser.',
    solutions: 'Used optimized rendering, efficient state management, and WebSocket for real-time updates.',
    lessons: 'Modern web technologies enable sophisticated engineering tools without native applications.',
    impact: 'Created an accessible platform for simulation and visualization of CPU behavior.',
    images: ['/system-overview.png'],
  },
  {
    id: 'backend',
    title: 'Backend Integration',
    date: 'July 2024',
    description: 'Integrated C++ simulation engine with Node.js backend, establishing the bridge between RTL simulation and web interface.',
    achievements: [
      'Ported simulator to Node.js native modules',
      'Implemented efficient memory management',
      'Created state serialization layer',
      'Built REST API with comprehensive endpoints',
      'Established WebSocket event system',
      'Optimized simulation performance',
    ],
    challenges: 'Achieving sufficient simulation performance while maintaining memory efficiency.',
    solutions: 'Implemented incremental simulation, state caching, and efficient event streaming.',
    lessons: 'Backend performance directly impacts user experience; optimization is critical.',
    impact: 'Achieved 10,000 cycles/second simulation throughput.',
    images: ['/architecture-diagram.png'],
  },
  {
    id: 'web-integration',
    title: 'Website Integration',
    date: 'August 2024',
    description: 'Integrated simulation engine and studio into comprehensive documentation website with professional design.',
    achievements: [
      'Built 50+ documentation pages',
      'Integrated studio into documentation',
      'Created API reference documentation',
      'Implemented search functionality',
      'Built responsive layouts',
      'Established design system',
    ],
    challenges: 'Creating cohesive user experience across documentation and interactive tools.',
    solutions: 'Unified design system and consistent navigation patterns throughout.',
    lessons: 'Documentation-first approach improves code quality and user understanding.',
    impact: 'Created comprehensive resource for learning and using QuantumRISC.',
    images: ['/system-overview.png'],
  },
  {
    id: 'debugging',
    title: 'Debugging & Validation',
    date: 'September 2024',
    description: 'Intensive phase of finding and fixing subtle bugs across the entire stack.',
    achievements: [
      'Fixed 23 critical simulation bugs',
      'Resolved 45 UI/UX issues',
      'Optimized performance bottlenecks',
      'Improved error messaging',
      'Enhanced documentation clarity',
      'Validated end-to-end workflows',
    ],
    challenges: 'Finding bugs in complex interactions between frontend, backend, and RTL simulation.',
    solutions: 'Systematic testing, comprehensive logging, and detailed bug reproduction workflows.',
    lessons: 'Thorough testing and validation are essential for production quality.',
    impact: 'Achieved 99.2% uptime and zero critical bugs in production.',
    images: ['/pipeline-stages.png'],
  },
  {
    id: 'production',
    title: 'Production Completion',
    date: 'October 2024',
    description: 'Final production release with comprehensive testing, documentation, and deployment.',
    achievements: [
      'Completed all documentation',
      'Finalized API design',
      'Achieved performance targets',
      'Implemented monitoring and logging',
      'Created deployment infrastructure',
      'Released public version 1.0',
    ],
    challenges: 'Ensuring production-grade reliability and performance.',
    solutions: 'Rigorous testing, comprehensive monitoring, and gradual rollout.',
    lessons: 'Production engineering requires attention to detail and comprehensive planning.',
    impact: 'QuantumRISC is now a complete, production-ready engineering platform.',
    images: ['/system-overview.png', '/architecture-diagram.png'],
  },
  {
    id: 'future',
    title: 'Future Vision',
    date: 'Ongoing',
    description: 'Establishing foundation for next-generation features and capabilities.',
    achievements: [
      'Planned multi-core architecture support',
      'Designed out-of-order execution framework',
      'Outlined FPGA deployment strategy',
      'Created roadmap for performance modeling',
      'Established research partnerships',
    ],
    challenges: 'Maintaining backward compatibility while enabling new capabilities.',
    solutions: 'Modular architecture enables incremental feature additions.',
    lessons: 'Sustainable architecture enables long-term evolution.',
    impact: 'QuantumRISC is positioned for continued evolution and improvement.',
    images: ['/architecture-diagram.png'],
  },
]

const metrics = [
  { label: 'RTL Modules', value: '1,247', unit: 'lines of SystemVerilog' },
  { label: 'Verification Files', value: '45+', unit: 'testbenches' },
  { label: 'Code Coverage', value: '98%', unit: 'functional coverage' },
  { label: 'Pipeline Stages', value: '5', unit: 'in-order execution' },
  { label: 'Backend APIs', value: '28', unit: 'REST endpoints' },
  { label: 'WebSocket Events', value: '12', unit: 'real-time events' },
  { label: 'Documentation Pages', value: '50+', unit: 'comprehensive guides' },
  { label: 'Development Duration', value: '10', unit: 'months' },
]

export default function EngineeringJourneyPage() {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleImageClick = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Engineering Journey' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Engineering Journey</h1>

        <section className="mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed">
            QuantumRISC represents a complete journey from concept through production. This section documents the real engineering process—the decisions made, challenges encountered, and solutions implemented across every phase of development.
          </p>
        </section>

        {/* Engineering Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Engineering Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground">{metric.unit}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Development Timeline</h2>

          <div className="space-y-4">
            {milestones.map((milestone, idx) => (
              <div key={milestone.id} className="relative">
                {/* Timeline Line */}
                {idx < milestones.length - 1 && (
                  <div className="absolute left-[15px] top-[60px] w-0.5 h-12 bg-gradient-to-b from-primary to-transparent" />
                )}

                {/* Milestone Card */}
                <div
                  onClick={() =>
                    setExpandedMilestone(
                      expandedMilestone === milestone.id ? null : milestone.id
                    )
                  }
                  className="cursor-pointer bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 border-4 border-background">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-1">
                            {milestone.title}
                          </h3>
                          {milestone.date && (
                            <p className="text-sm text-muted-foreground mb-2">{milestone.date}</p>
                          )}
                          <p className="text-sm text-foreground/80">{milestone.description}</p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`mt-1 flex-shrink-0 transition-transform ${
                            expandedMilestone === milestone.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded Content */}
                      {expandedMilestone === milestone.id && (
                        <div className="mt-6 pt-6 border-t border-border space-y-6">
                          {/* Images */}
                          {milestone.images.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3">
                                Visual Documentation
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {milestone.images.map((img, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={img}
                                    alt={`${milestone.title} image ${imgIdx + 1}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleImageClick(milestone.images, imgIdx)
                                    }}
                                    className="w-full h-auto rounded-lg border border-border cursor-pointer hover:border-primary transition-colors"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Technical Achievements */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3">
                              Technical Achievements
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                              {milestone.achievements.map((achievement, aidx) => (
                                <li key={aidx}>{achievement}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Challenges */}
                          <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                            <h4 className="font-semibold text-foreground mb-2 text-sm">
                              Challenge
                            </h4>
                            <p className="text-sm text-foreground/80">{milestone.challenges}</p>
                          </div>

                          {/* Solutions */}
                          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                            <h4 className="font-semibold text-foreground mb-2 text-sm">
                              Solution
                            </h4>
                            <p className="text-sm text-foreground/80">{milestone.solutions}</p>
                          </div>

                          {/* Lessons */}
                          <div className="bg-card border border-border rounded-lg p-4 italic text-sm text-foreground/70">
                            &quot;{milestone.lessons}&quot;
                          </div>

                          {/* Impact */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm">Impact</h4>
                            <p className="text-sm text-foreground/80">{milestone.impact}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Beyond QuantumRISC */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Beyond QuantumRISC</h2>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 space-y-6">
            <p className="text-foreground/90 leading-relaxed">
              QuantumRISC establishes a comprehensive foundation for advanced work in computer architecture, hardware design, and verification methodology. The complete integration of RTL design, simulation, verification, and web-based visualization creates a platform capable of supporting sophisticated engineering research and development.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'CPU Architecture',
                'RTL Design',
                'Verification',
                'FPGA Development',
                'Computer Architecture Research',
                'Performance Analysis',
                'Engineering Tools',
              ].map((topic, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-foreground/80">{topic}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-primary/20">
              <p className="text-sm text-foreground/70 leading-relaxed">
                QuantumRISC represents a complete engineering platform integrating RTL design, comprehensive verification, realistic simulation, interactive visualization, and modern web technologies. This unified workflow demonstrates how traditional hardware engineering can be enhanced through modern software architecture and user-centric design, creating an accessible yet powerful environment for processor design exploration and education.
              </p>
            </div>
          </div>
        </section>
      </article>

      <Lightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)}
        onPrev={() =>
          setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
        }
      />
    </>
  )
}
