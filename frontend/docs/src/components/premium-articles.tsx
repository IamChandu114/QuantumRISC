'use client'

import { ExternalLink } from 'lucide-react'

interface ArticlePlatform {
  id: string
  name: string
  logo: string
  description: string
  buttonText: string
  url: string
  stats: {
    articles: number
    lastUpdated: string
    readingTime: string
  }
  tags: string[]
  gradient: string
}

const platforms: ArticlePlatform[] = [
  {
    id: 'medium',
    name: 'Medium',
    logo: '📖',
    description: 'Read in-depth engineering stories, architecture decisions, development journey, implementation insights, and project evolution.',
    buttonText: 'Read Medium',
    url: 'https://medium.com/@ca4443700',
    stats: {
      articles: '9+',
      lastUpdated: 'July 2026',
      readingTime: '45 min',
    },
    tags: ['RISC-V', 'CPU Architecture', 'Computer Architecture', 'Engineering'],
    gradient: 'bg-emerald-900/10',
  },
]

export function PremiumArticles() {
  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Technical Articles</h2>
        <p className="text-lg text-muted-foreground">
          Explore detailed engineering articles documenting the architecture, implementation, challenges, and evolution of the QuantumRISC Engineering Platform.
        </p>
      </div>

      <div className="grid md:grid-cols-1 gap-8">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`group relative overflow-hidden rounded-xl border border-border p-6 ${platform.gradient} transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10`}
          >

            <div>
              {/* Header with logo */}
              <div className="mb-6 flex items-center gap-4">
                <div className="text-5xl">{platform.logo}</div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">Engineering Articles</p>
                </div>
              </div>

              {/* Description */}
              <p className="mb-6 text-foreground/90 leading-relaxed">{platform.description}</p>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-card/30 p-3 backdrop-blur-sm border border-border/30">
                <div>
                  <div className="text-sm font-semibold text-primary">{platform.stats.articles}</div>
                  <div className="text-xs text-muted-foreground">Articles</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary">{platform.stats.lastUpdated}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary">{platform.stats.readingTime}</div>
                  <div className="text-xs text-muted-foreground">Reading</div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6 flex flex-wrap gap-2">
                {platform.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Button */}
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 gap-2"
              >
                {platform.buttonText}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Future platforms placeholder */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground text-center">
          More platforms coming soon: IEEE Publications, Research Papers, Dev.to, and Personal Blog
        </p>
      </div>
    </section>
  )
}
