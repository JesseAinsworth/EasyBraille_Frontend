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
import { useAuth } from "@/hooks/use-auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor, asegúrate de que ambas contraseñas sean idénticas.",
        type: "error",
        duration: 5000
      })
      return
    }

    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // ✅ solo enviar email y password
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("Backend returned HTML instead of JSON:", errorText.substring(0, 200))
        throw new Error("Error de conexión con el servidor. Por favor, intenta más tarde.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario")
      }

      if (!data.user) {
        throw new Error("Respuesta del servidor incompleta.")
      }

      // ✅ Guardar userId correctamente
      const userToStore = {
        ...data.user,
        role: data.user.role || "user",
        isActive: data.user.isActive !== undefined ? data.user.isActive : true,
        userId: data.user.userId || data.user._id // el backend ya devuelve userId
      }

      console.log("🔧 Debug - userToStore:", userToStore)
      
      // Usar el método login del hook para actualizar la barra automáticamente
      login(userToStore, data.token || "")

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: `Hola ${data.user?.name || data.user?.email?.split("@")[0] || "Usuario"}, tu cuenta ha sido creada. Redirigiendo...`,
        type: "success",
        duration: 4000
      })

      // Usar window.location para forzar recarga completa con el usuario guardado
      if (typeof window !== 'undefined') {
        window.location.href = "/translator"
      }
    } catch (error: any) {
      console.error("Error de registro:", error)
      
      let errorTitle = "Error de registro"
      let errorMessage = "Ocurrió un error durante el registro. Por favor, intenta de nuevo."
      
      if (error.name === "AbortError") {
        errorTitle = "Tiempo de espera agotado"
        errorMessage = "La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente."
      } else if (error.message) {
        // Mensajes específicos del backend
        if (error.message.includes("ya existe") || error.message.includes("already exists")) {
          errorTitle = "Usuario ya registrado"
          errorMessage = "Ya existe una cuenta con este correo electrónico. ¿Deseas iniciar sesión?"
        } else if (error.message.includes("correo") || error.message.includes("email")) {
          errorTitle = "Correo inválido"
          errorMessage = "Por favor, ingresa un correo electrónico válido."
        } else if (error.message.includes("contraseña") || error.message.includes("password")) {
          errorTitle = "Contraseña inválida"
          errorMessage = "La contraseña debe tener al menos 6 caracteres."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        type: "error",
        duration: 6000
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
          <CardDescription className="text-center">
            Ingresa tus datos para registrarte en la plataforma
          </CardDescription>
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
