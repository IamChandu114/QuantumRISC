import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ThemeProvider } from 'next-themes'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Sidebar />
      <Header />
      <main className="lg:ml-64 min-h-screen bg-background pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </ThemeProvider>
  )
}
