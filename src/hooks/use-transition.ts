"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"

/**
 * Hook personalizado para manejar transiciones de navegación
 * Proporciona estados de carga y funciones optimizadas
 */
export function useNavTransition() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = useState(false)

  // Navegación optimizada con transiciones suaves
  const navigateTo = useCallback(
    (href: string) => {
      setIsNavigating(true)

      // Usar startTransition para no bloquear la UI
      startTransition(() => {
        router.push(href)

        // Pequeño timeout para asegurar que la animación se vea
        setTimeout(() => {
          setIsNavigating(false)
        }, 300)
      })
    },
    [router],
  )

  return {
    isPending,
    isNavigating,
    navigateTo,
  }
}
