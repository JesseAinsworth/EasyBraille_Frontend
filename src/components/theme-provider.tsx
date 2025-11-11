"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Definir el tipo ThemeProviderProps manualmente
type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
