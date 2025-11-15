"use client"


import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LogoSection } from "@/components/LogoSection"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Realizar la solicitud de inicio de sesión a la API
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar mensajes específicos basados en el código devuelto por el backend
        if (data.code === "invalid_credentials") {
          toast({
            title: "Error de inicio de sesión",
            description: "Contraseña incorrecta",
            variant: "destructive",
          })
          return
        }

        if (data.code === "not_registered") {
          toast({
            title: "Usuario no registrado",
            description: "No existe una cuenta con ese correo. Puedes registrarte.",
            variant: "destructive",
          })
          // Opcional: redirigir a registro automáticamente
          // router.push('/register')
          return
        }

        if (data.code === "service_unavailable") {
          toast({
            title: "Servicio temporalmente indisponible",
            description: "Intenta nuevamente más tarde.",
            variant: "destructive",
          })
          return
        }

        throw new Error(data.error || "Error al iniciar sesión")
      }

      // Guardar información del usuario en localStorage
      localStorage.setItem("user", JSON.stringify(data.user))

      // Guardar el token si está disponible
      if (data.token) {
        localStorage.setItem("token", data.token)
      }

      console.log("✅ Login exitoso:", data.user)

      toast({
        title: data.message || "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.user.name || data.user.email.split("@")[0]}`,
      })

      // Verificar si hay una URL de redirección en los parámetros de consulta
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get("redirectTo")

      if (redirectTo) {
        router.push(redirectTo)
      } else {
        // Redirigir según el rol del usuario
        if (data.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/translator")
        }
      }
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales incorrectas. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // No incluir usuarios de prueba en producción

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <LogoSection size="medium" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/reset-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Quick-login removed for production; use the form above to sign in */}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <div className="text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Regístrate
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
