'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

const sections = [
  {
    title: 'Overview',
    items: [
      { label: 'Overview', href: '/docs/overview' },
    ],
  },
  {
    title: 'Architecture',
    items: [
      { label: 'System Architecture', href: '/docs/architecture' },
      { label: 'RTL Architecture', href: '/docs/architecture/rtl' },
      { label: 'Backend Architecture', href: '/docs/architecture/backend' },
      { label: 'Frontend Architecture', href: '/docs/architecture/frontend' },
      { label: 'Pipeline Flow', href: '/docs/architecture/pipeline' },
    ],
  },
  {
    title: 'Engineering',
    items: [
      { label: 'Engineering Overview', href: '/docs/engineering' },
      { label: 'Instruction Lifecycle', href: '/docs/engineering/instruction' },
      { label: 'Simulation Engine', href: '/docs/engineering/simulation' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Installation Guide', href: '/docs/guides/installation' },
      { label: 'API Documentation', href: '/docs/guides/api' },
      { label: 'WebSocket Documentation', href: '/docs/guides/websocket' },
      { label: 'Guides Overview', href: '/docs/guides' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Resources & FAQ', href: '/docs/resources' },
      { label: 'FAQ', href: '/docs/resources/faq' },
    ],
  },
  {
    title: 'Engineering Journey',
    items: [
      { label: 'Complete Timeline', href: '/docs/engineering-journey' },
    ],
  },
  {
    title: 'Technical Articles',
    items: [
      { label: 'Medium Articles', href: '/docs/articles/medium' },
    ],
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>(['Overview', 'Architecture', 'Engineering Journey'])

  const toggleSection = (section: string) => {
    setExpanded((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 lg:hidden bg-primary text-primary-foreground rounded-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-40 pt-4 lg:pt-0`}
      >
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-primary mb-1">QuantumRISC</h1>
          <p className="text-xs text-muted-foreground">Engineering Docs</p>
        </div>

        <nav className="space-y-1 px-2">
          {sections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors"
              >
                <span>{section.title}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    expanded.includes(section.title) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded.includes(section.title) && (
                <div className="ml-2 space-y-1 mt-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
