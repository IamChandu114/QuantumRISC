export function getDocsBasePath(pathname = window.location.pathname) {
  return pathname.startsWith('/documentation') ? '/documentation' : '/docs'
}

export function resolveDocsHref(href: string, pathname = window.location.pathname) {
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return href
  }

  const basePath = getDocsBasePath(pathname)

  if (href === '/docs' || href === '/documentation') {
    return basePath
  }

  if (href.startsWith('/docs/')) {
    return `${basePath}${href.slice('/docs'.length)}`
  }

  if (href.startsWith('/documentation/')) {
    return `${basePath}${href.slice('/documentation'.length)}`
  }

  return href
}
