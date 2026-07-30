import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const saved = window.localStorage.getItem('quantumrisc-theme') as Theme | null
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      setTheme(saved)
    }
  }, [])

  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.classList.toggle('light', resolved === 'light')
    window.localStorage.setItem('quantumrisc-theme', theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    return {
      theme,
      setTheme,
      resolvedTheme,
    }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    return {
      theme: 'dark' as const,
      setTheme: () => undefined,
      resolvedTheme: 'dark' as const,
    }
  }

  return value
}
