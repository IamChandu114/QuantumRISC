'use client'

import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default function ArticlesPage() {
  const articles = [
    {
      id: 1,
      title: 'Building a 5-Stage CPU Pipeline: Architecture & Design',
      platform: 'Medium',
      url: 'https://medium.com/@quantumrisc/building-a-5-stage-cpu-pipeline-architecture-design',
      date: 'November 2024',
      readTime: '12 min read',
      tags: ['RISC-V', 'CPU Architecture', 'Pipelining'],
      excerpt: 'Deep dive into how we designed and implemented the 5-stage pipeline for QuantumRISC, covering fetch, decode, execute, memory, and write-back stages.'
    },
    {
      id: 2,
      title: 'Solving Hazards in CPU Design: Detection & Forwarding',
      platform: 'Hashnode',
      url: 'https://hashnode.com/@quantumrisc/solving-hazards-in-cpu-design',
      date: 'October 2024',
      readTime: '15 min read',
      tags: ['Hazard Detection', 'Data Forwarding', 'Performance'],
      excerpt: 'Comprehensive guide on identifying and resolving data and control hazards in pipelined CPU architectures.'
    },
    {
      id: 3,
      title: 'RTL Design Best Practices: From Concept to Simulation',
      platform: 'Medium',
      url: 'https://medium.com/@quantumrisc/rtl-design-best-practices',
      date: 'September 2024',
      readTime: '18 min read',
      tags: ['RTL Design', 'SystemVerilog', 'Verification'],
      excerpt: 'Learn RTL design patterns and best practices used in QuantumRISC, including module hierarchy, state machines, and clock domain crossing.'
    },
    {
      id: 4,
      title: 'Building a Web-Based CPU Simulator with WebSockets',
      platform: 'Hashnode',
      url: 'https://hashnode.com/@quantumrisc/web-cpu-simulator-websockets',
      date: 'August 2024',
      readTime: '14 min read',
      tags: ['WebSockets', 'Real-time Simulation', 'Backend'],
      excerpt: 'Technical walkthrough of implementing real-time CPU simulation in the web browser using WebSocket connections and Node.js backend.'
    },
    {
      id: 5,
      title: 'Verification Methodology for Complex Processors',
      platform: 'Medium',
      url: 'https://medium.com/@quantumrisc/verification-methodology',
      date: 'July 2024',
      readTime: '16 min read',
      tags: ['Verification', 'Testing', 'Coverage'],
      excerpt: 'Explore the verification framework used in QuantumRISC, including testbenches, constraint-based randomization, and functional coverage metrics.'
    }
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Docs', href: '/docs' },
            { label: 'Technical Articles', href: '/docs/articles' },
          ]}
        />

        <div className="mt-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Technical Articles</h1>
          <p className="text-muted-foreground mb-8">
            In-depth engineering articles covering CPU architecture, RTL design, verification, and real-time simulation techniques.
          </p>

          <div className="grid gap-6 mb-12">
            {articles.map((article) => (
              <div
                key={article.id}
                className="border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {article.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                      <span className="text-xs text-muted-foreground">{article.readTime}</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{article.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{article.excerpt}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm"
                >
                  Read Article
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>

          <Pagination
            prevPage={{ label: 'Engineering Journey', href: '/docs/engineering-journey' }}
            nextPage={{ label: 'Medium Articles', href: '/docs/articles/medium' }}
          />
        </div>
      </div>
    </div>
  )
}
