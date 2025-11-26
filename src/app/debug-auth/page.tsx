"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DebugAuthPage() {
  const [userData, setUserData] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get user data and token from localStorage
    if (typeof window === 'undefined') return
    
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing user data:", error)
        setUserData({ error: "Invalid JSON in user data" })
      }
    }

    setToken(storedToken)
  }, [])

  const handleClearStorage = () => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUserData(null)
    setToken(null)
  }

  const handleResetAdmin = () => {
    if (typeof window === 'undefined') return
    
    const adminUser = {
      _id: "1",
      id: "1",
      name: "Administrador",
      email: "admin@example.com",
      role: "admin",
    }

    localStorage.setItem("user", JSON.stringify(adminUser))
    localStorage.setItem("token", "mock-admin-token-12345")

    setUserData(adminUser)
    setToken("mock-admin-token-12345")
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Depuración de Autenticación</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos de Usuario</CardTitle>
            <CardDescription>Información almacenada en localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
              {userData ? JSON.stringify(userData, null, 2) : "No hay datos de usuario"}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token</CardTitle>
            <CardDescription>Token de autenticación almacenado en localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">{token || "No hay token"}</pre>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={handleClearStorage} variant="destructive">
          Limpiar almacenamiento
        </Button>
        <Button onClick={handleResetAdmin} variant="outline">
          Restablecer como Admin
        </Button>
        <Button onClick={() => router.push("/admin")} variant="default">
          Ir al Panel de Admin
        </Button>
        <Button onClick={() => router.push("/login")} variant="outline">
          Ir a Login
        </Button>
      </div>
    </div>
  )
}
