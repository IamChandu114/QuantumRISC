import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'
import { resolveDocsHref } from '@/lib/docs-path'

type LinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    prefetch?: boolean
    replace?: boolean
  }
>

export default function Link({ href, children, ...props }: LinkProps) {
  const resolved = typeof window === 'undefined' ? href : resolveDocsHref(href)
  return (
    <a href={resolved} {...props}>
      {children}
    </a>
  )
}
