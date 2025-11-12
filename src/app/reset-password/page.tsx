"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
// Client-side mock implementations for reset password flow (demo only)
function generateResetPasswordToken(email: string) {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function saveResetToken(email: string, token: string) {
  // Store token in localStorage for demo/testing
  const map = JSON.parse(localStorage.getItem("resetTokens") || "{}")
  map[token] = { email, issuedAt: Date.now() }
  localStorage.setItem("resetTokens", JSON.stringify(map))
}

function verifyResetToken(token: string) {
  const map = JSON.parse(localStorage.getItem("resetTokens") || "{}")
  const entry = map[token]
  if (!entry) return false
  // expire after 24h
  return Date.now() - entry.issuedAt < 24 * 60 * 60 * 1000
}

function resetPasswordWithToken(token: string, newPassword: string) {
  const map = JSON.parse(localStorage.getItem("resetTokens") || "{}")
  const entry = map[token]
  if (!entry) return false
  // In a real app we would update the user's password in DB. Here we just remove token.
  delete map[token]
  localStorage.setItem("resetTokens", JSON.stringify(map))
  return true
}
import { LogoSection } from "@/components/LogoSection"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"request" | "reset">("request")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()
  const isRequest = step === "request"

  // Si hay un token en la URL, verificarlo y mostrar el formulario de restablecimiento
  useEffect(() => {
    if (!token) return

    // Verificar que el token sea válido
    const isValid = verifyResetToken(token)
    if (isValid) {
      setStep("reset")
    } else {
      toast({
        title: "Token inválido",
        description: "El enlace de restablecimiento ha expirado o no es válido.",
        variant: "destructive",
      })
    }
  }, [token, toast])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // En una aplicación real, esto enviaría un correo electrónico
      // Para esta demo, simplemente generamos un token y lo guardamos
      setTimeout(() => {
        try {
          const token = generateResetPasswordToken(email)
          saveResetToken(email, token)

          // En una aplicación real, enviaríamos un correo con el enlace
          // Para esta demo, mostramos el enlace en la consola
          console.log(`Enlace de restablecimiento: ${window.location.origin}/reset-password?token=${token}`)

          toast({
            title: "Solicitud enviada",
            description:
              "Se ha enviado un enlace de restablecimiento a tu correo electrónico. (Revisa la consola para ver el enlace)",
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "No se encontró ninguna cuenta con ese correo electrónico.",
            variant: "destructive",
          })
        }

        setIsLoading(false)
      }, 1500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "Error",
        description: "Token de restablecimiento no válido.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simular una llamada a la API
      setTimeout(() => {
        const success = resetPasswordWithToken(token, password)

        if (success) {
          toast({
            title: "Contraseña actualizada",
            description: "Tu contraseña ha sido actualizada correctamente.",
          })

          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        } else {
          toast({
            title: "Error",
            description: "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
            variant: "destructive",
          })
        }

        setIsLoading(false)
      }, 1500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al restablecer tu contraseña. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
      <Card className="w-full max-w-md">
  {isRequest ? (
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <LogoSection size="medium" showText={false} />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                {isRequest ? "Recuperar contraseña" : "Crear nueva contraseña"}
              </CardTitle>
              <CardDescription className="text-center">
                {isRequest
                  ? "Ingresa tu correo electrónico para recibir un enlace de recuperación"
                  : "Ingresa tu nueva contraseña"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRequestReset}>
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
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
                <div className="text-center text-sm">
                  <Link href="/login" className="text-primary hover:underline">
                    Volver al inicio de sesión
                  </Link>
                </div>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <LogoSection size="medium" showText={false} />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                {isRequest ? "Recuperar contraseña" : "Crear nueva contraseña"}
              </CardTitle>
              <CardDescription className="text-center">
                {isRequest
                  ? "Ingresa tu correo electrónico para recibir un enlace de recuperación"
                  : "Ingresa tu nueva contraseña"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
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
                  {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
