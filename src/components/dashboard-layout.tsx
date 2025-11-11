"use client"

import { type ReactNode, Suspense } from "react"
import { usePrefetchRoutes } from "@/hooks/use-prefetch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Layout optimizado para el dashboard
 * Implementa prefetching y Suspense para mejorar rendimiento
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Precargar rutas comunes para navegación instantánea
  usePrefetchRoutes()

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] h-[calc(100vh-4rem)]">
      {/* Sidebar se mantiene en su lugar */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  )
}

export default DashboardLayout
