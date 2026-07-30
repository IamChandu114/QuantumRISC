export function redirect(href: string) {
  if (typeof window !== 'undefined') {
    window.location.replace(href)
  }
}
