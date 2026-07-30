import type { ReactElement } from 'react'
import DocsLayout from '@/app/docs/layout'
import Home from '@/app/page'
import ArchitecturePage from '@/app/docs/architecture/page'
import BackendArchitecturePage from '@/app/docs/architecture/backend/page'
import FrontendArchitecturePage from '@/app/docs/architecture/frontend/page'
import PipelineArchitecturePage from '@/app/docs/architecture/pipeline/page'
import RTLArchitecturePage from '@/app/docs/architecture/rtl/page'
import ArticlesPage from '@/app/docs/articles/page'
import HashnodePage from '@/app/docs/articles/hashnode/page'
import MediumPage from '@/app/docs/articles/medium/page'
import EngineeringPage from '@/app/docs/engineering/page'
import InstructionPage from '@/app/docs/engineering/instruction/page'
import SimulationPage from '@/app/docs/engineering/simulation/page'
import JourneyPage from '@/app/docs/engineering-journey/page'
import GuidesPage from '@/app/docs/guides/page'
import ApiPage from '@/app/docs/guides/api/page'
import InstallationPage from '@/app/docs/guides/installation/page'
import WebsocketPage from '@/app/docs/guides/websocket/page'
import OverviewPage from '@/app/docs/overview/page'
import ResourcesPage from '@/app/docs/resources/page'
import FaqPage from '@/app/docs/resources/faq/page'

type PageComponent = () => ReactElement

const docsRouteMap: Record<string, PageComponent> = {
  '/docs': Home,
  '/documentation': Home,
  '/docs/overview': OverviewPage,
  '/docs/overview/vision': OverviewPage,
  '/documentation/overview': OverviewPage,
  '/documentation/overview/vision': OverviewPage,
  '/docs/architecture': ArchitecturePage,
  '/documentation/architecture': ArchitecturePage,
  '/docs/architecture/backend': BackendArchitecturePage,
  '/documentation/architecture/backend': BackendArchitecturePage,
  '/docs/architecture/frontend': FrontendArchitecturePage,
  '/documentation/architecture/frontend': FrontendArchitecturePage,
  '/docs/architecture/pipeline': PipelineArchitecturePage,
  '/documentation/architecture/pipeline': PipelineArchitecturePage,
  '/docs/architecture/rtl': RTLArchitecturePage,
  '/documentation/architecture/rtl': RTLArchitecturePage,
  '/docs/articles': ArticlesPage,
  '/documentation/articles': ArticlesPage,
  '/docs/articles/hashnode': HashnodePage,
  '/documentation/articles/hashnode': HashnodePage,
  '/docs/articles/medium': MediumPage,
  '/documentation/articles/medium': MediumPage,
  '/docs/engineering': EngineeringPage,
  '/documentation/engineering': EngineeringPage,
  '/docs/engineering/instruction': InstructionPage,
  '/documentation/engineering/instruction': InstructionPage,
  '/docs/engineering/simulation': SimulationPage,
  '/documentation/engineering/simulation': SimulationPage,
  '/docs/engineering-journey': JourneyPage,
  '/documentation/engineering-journey': JourneyPage,
  '/docs/guides': GuidesPage,
  '/documentation/guides': GuidesPage,
  '/docs/guides/api': ApiPage,
  '/documentation/guides/api': ApiPage,
  '/docs/guides/developer': GuidesPage,
  '/documentation/guides/developer': GuidesPage,
  '/docs/guides/installation': InstallationPage,
  '/documentation/guides/installation': InstallationPage,
  '/docs/guides/websocket': WebsocketPage,
  '/documentation/guides/websocket': WebsocketPage,
  '/docs/resources': ResourcesPage,
  '/documentation/resources': ResourcesPage,
  '/docs/resources/faq': FaqPage,
  '/documentation/resources/faq': FaqPage,
}

function normalizePath(pathname: string) {
  if (!pathname) return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export default function App() {
  const pathname = normalizePath(window.location.pathname)
  const Page = docsRouteMap[pathname] ?? Home

  if (pathname === '/docs' || pathname === '/documentation') {
    return <Page />
  }

  if (pathname.startsWith('/docs/') || pathname.startsWith('/documentation/')) {
    return (
      <DocsLayout>
        <Page />
      </DocsLayout>
    )
  }

  return <Page />
}
