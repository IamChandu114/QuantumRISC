'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { PremiumArticles } from '@/components/premium-articles'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import { Code2, Cpu, Zap, BookOpen, Layers, Cog } from 'lucide-react'

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Sidebar />
      <Header />

      <main className="lg:ml-64 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-6">
              <Cpu className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 text-foreground">QuantumRISC</h1>
            <p className="text-xl text-muted-foreground mb-2">Professional CPU Engineering Platform</p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A world-class RISC-V architecture implementation with RTL design, comprehensive verification, and full-stack engineering excellence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Code2,
                title: 'Architecture',
                description: 'Complete system, RTL, backend, and frontend architecture documentation',
              },
              {
                icon: Zap,
                title: 'Performance',
                description: 'Comprehensive performance metrics and optimization strategies',
              },
              {
                icon: Layers,
                title: 'Simulation',
                description: 'Advanced simulation engine and verification methodology',
              },
              {
                icon: Cog,
                title: 'Engineering',
                description: 'Production-grade design decisions and engineering practices',
              },
              {
                icon: BookOpen,
                title: 'Documentation',
                description: 'Complete API, WebSocket, and developer guides',
              },
              {
                icon: Cpu,
                title: 'Implementation',
                description: 'Real-world pipeline flow and instruction lifecycle details',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-all">
                <feature.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Premium Articles Section */}
          <PremiumArticles />

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Start Reading</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Executive Summary', href: '/docs/overview' },
                { label: 'System Architecture', href: '/docs/architecture' },
                { label: 'Installation Guide', href: '/docs/guides/installation' },
                { label: 'API Documentation', href: '/docs/guides/api' },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="px-4 py-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all text-foreground font-medium text-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4 text-center">
            {[
              { value: '8+', label: 'Major Sections' },
              { value: '50+', label: 'Pages' },
              { value: '100%', label: 'Coverage' },
              { value: 'Production', label: 'Grade' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </ThemeProvider>
  )
}
