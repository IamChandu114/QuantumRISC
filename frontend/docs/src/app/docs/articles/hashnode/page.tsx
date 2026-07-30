'use client'

import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default function HashnodeArticlesPage() {
  const articles = [
    {
      title: 'Solving Hazards in CPU Design: Detection & Forwarding',
      url: 'https://hashnode.com/@quantumrisc/solving-hazards-in-cpu-design',
      date: 'October 2024',
      readTime: '15 min read',
      likes: '342+',
      excerpt: 'Comprehensive guide on identifying and resolving data and control hazards in pipelined CPU architectures.'
    },
    {
      title: 'Building a Web-Based CPU Simulator with WebSockets',
      url: 'https://hashnode.com/@quantumrisc/web-cpu-simulator-websockets',
      date: 'August 2024',
      readTime: '14 min read',
      likes: '289+',
      excerpt: 'Technical walkthrough of implementing real-time CPU simulation in the web browser using WebSocket connections and Node.js backend.'
    },
    {
      title: 'FastAPI Backend Architecture for Real-Time Simulation',
      url: 'https://hashnode.com/@quantumrisc/fastapi-backend-architecture',
      date: 'July 2024',
      readTime: '16 min read',
      likes: '198+',
      excerpt: 'Explore how we built the FastAPI backend for QuantumRISC, handling concurrent simulations, WebSocket connections, and real-time state updates.'
    },
    {
      title: 'Instruction Set Design Principles and Trade-offs',
      url: 'https://hashnode.com/@quantumrisc/instruction-set-design',
      date: 'June 2024',
      readTime: '13 min read',
      likes: '267+',
      excerpt: 'Deep analysis of RISC-V ISA and how we implemented QuantumRISC instruction set, including encoding, decoding, and execution strategies.'
    },
    {
      title: 'Real-Time Metrics and Performance Monitoring',
      url: 'https://hashnode.com/@quantumrisc/real-time-metrics-monitoring',
      date: 'May 2024',
      readTime: '12 min read',
      likes: '156+',
      excerpt: 'How we implemented real-time metrics collection, including IPC calculation, cache miss rates, and branch prediction accuracy tracking.'
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Docs', href: '/docs' },
            { label: 'Articles', href: '/docs/articles' },
            { label: 'Hashnode', href: '/docs/articles/hashnode' },
          ]}
        />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔗</span>
            <h1 className="text-4xl font-bold text-foreground">Hashnode Articles</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Detailed technical deep-dives on Hashnode covering backend architecture, WebSocket implementation, real-time simulation, and performance optimization.
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
                      {article.date} • {article.readTime} • {article.likes} likes
                    </p>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>

          <Pagination
            prevPage={{ label: 'Medium Articles', href: '/docs/articles/medium' }}
            nextPage={{ label: 'All Articles', href: '/docs/articles' }}
          />
        </div>
      </div>
    </div>
  )
}
