"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ConfigRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    
    if (!userData || !token) {
      // Redirigir al login con parámetro para volver aquí después
      router.push("/login?redirectTo=/app/settings")
    } else {
      // Si está autenticado, redirigir a la página de configuración
      router.push("/app/settings")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
