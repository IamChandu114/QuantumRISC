'use client'

import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default function MediumArticlesPage() {
  const articles = [
    {
      title: 'Building Quantum RISC: From RTL to a Production-Grade CPU Engineering Platform',
      url: 'https://medium.com/@ca4443700/building-quantum-risc-from-rtl-to-a-production-grade-cpu-engineering-platform-fe10dbe31326',
      date: 'December 2024',
      readTime: '28 min read',
      claps: '450+',
      excerpt: 'A complete engineering journey covering processor architecture, RTL design, verification, backend integration, and the development of a full CPU engineering platform.'
    },
    {
      title: 'Building an Interactive CPU Engineering Studio: Designing a Real-Time Visualization Environment for Processor Development',
      url: 'https://medium.com/@ca4443700/building-an-interactive-cpu-engineering-studio-designing-a-real-time-visualization-environment-for-362363a68d74?sharedUserId=ca4443700',
      date: 'July 2026',
      readTime: '24 min read',
      claps: '380+',
      excerpt: 'An in-depth exploration of the engineering studio, including live pipeline visualization, register and memory inspection, WebSocket synchronization, and real-time architectural analysis.'
    },
    {
      title: 'From Verilog Waveforms to Interactive Engineering Dashboards: Building a Cycle-Accurate RTL Debugging Platform',
      url: 'https://medium.com/@ca4443700/from-verilog-waveforms-to-interactive-engineering-dashboards-building-a-cycle-accurate-rtl-cd09b03ccb48?sharedUserId=ca4443700',
      date: 'July 2026',
      readTime: '22 min read',
      claps: '325+',
      excerpt: 'A technical deep dive into VCD parsing, architectural state reconstruction, backend simulation pipelines, and transforming low-level RTL execution into an interactive debugging environment.'
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Docs', href: '/docs' },
            { label: 'Articles', href: '/docs/articles' },
            { label: 'Medium', href: '/docs/articles/medium' },
          ]}
        />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📖</span>
            <h1 className="text-4xl font-bold text-foreground">QuantumRISC Engineering Series</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Three technical deep dives into CPU architecture, RTL simulation, and engineering platform design.
          </p>

          <div className="grid gap-4 mb-12">
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border rounded-lg p-5 hover:border-primary/50 hover:shadow-md hover:bg-accent/5 transition-all bg-card group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{article.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      {article.date} • {article.readTime} • {article.claps} claps
                    </p>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>

          <Pagination
            prevPage={{ label: 'All Articles', href: '/docs/articles' }}
            nextPage={undefined}
          />
        </div>
      </div>
    </div>
  )
}
