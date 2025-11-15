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

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      // Verificar si la respuesta es HTML (error) en lugar de JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("Backend returned HTML instead of JSON:", errorText.substring(0, 200))
        throw new Error("Error de conexión con el servidor. Por favor, intenta más tarde.")
      }

      const data = await response.json()

      // Validar estructura de respuesta
      if (!data || typeof data !== 'object') {
        console.error("Invalid response structure:", data)
        throw new Error("Respuesta inválida del servidor.")
      }

      if (!response.ok) {
        // Manejar códigos específicos del backend
        if (data.code === "already_registered") {
          toast({
            title: "Usuario ya registrado",
            description: "Ya existe una cuenta con este correo. Intenta iniciar sesión.",
            variant: "destructive",
          })
          return
        }

        if (data.code === "invalid_data") {
          toast({
            title: "Datos inválidos",
            description: data.error || "Revisa los campos del formulario.",
            variant: "destructive",
          })
          return
        }

        throw new Error(data.error || "Error al registrar usuario")
      }

      // Verificar que la respuesta tenga la estructura esperada
      if (!data.user) {
        console.error("Missing user data in response:", data)
        throw new Error("Respuesta del servidor incompleta.")
      }

      // Registro exitoso: el backend devuelve token y cookie
      toast({
        title: data.message || "Registro exitoso",
        description: `Bienvenido, ${data.user?.name || data.user?.email?.split("@")[0] || "Usuario"}`
      })

      // Si el backend estableció cookie de sesión, redirigimos directamente
      router.push("/translator")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error durante el registro. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <LogoSection size="medium" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Crear cuenta</CardTitle>
          <CardDescription className="text-center">Ingresa tus datos para registrarte en la plataforma</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
