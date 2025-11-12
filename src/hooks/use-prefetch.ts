"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

// Rutas comunes que queremos precargar
const commonRoutes = ["/app/settings", "/admin", "/translator", "/history"]

/**
 * Hook personalizado para precargar rutas comunes
 * Mejora significativamente el tiempo de respuesta al navegar
 */
export function usePrefetchRoutes() {
  const router = useRouter()

  // Usamos useCallback para evitar recrear la función en cada render
  const prefetchRoutes = useCallback(() => {
    // Prefetch de rutas comunes
    commonRoutes.forEach((route) => {
      router.prefetch(route)
    })
  }, [router])

  useEffect(() => {
    // Precargar rutas después de que el componente se monte
    prefetchRoutes()

    // También podemos precargar cuando el usuario hace hover en el navbar
    const navbar = document.querySelector("nav")
    if (navbar) {
      navbar.addEventListener("mouseenter", prefetchRoutes)

      return () => {
        navbar.removeEventListener("mouseenter", prefetchRoutes)
      }
    }
  }, [prefetchRoutes])
}
