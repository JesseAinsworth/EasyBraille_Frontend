export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { createToken } from "@/lib/auth.server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    console.log("🔐 Intento de login para:", email)

    // Primero intentar con la base de datos
    try {
      const usersCollection = await getUsersCollection()
      const user = await usersCollection.findOne({ email: email.toLowerCase().trim() })

      if (user) {
        console.log("👤 Usuario encontrado en BD:", {
          email: user.email,
          role: user.role,
          hasPassword: !!user.password,
        })

        // Verificar si el usuario está activo
        if (user.isActive === false) {
          console.log("❌ Usuario inactivo:", email)
          return NextResponse.json({ error: "Cuenta desactivada" }, { status: 401 })
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password)
        console.log("🔑 Verificación de contraseña:", isValidPassword)

        if (!isValidPassword) {
          console.log("❌ Contraseña incorrecta para usuario de BD:", email)
          // Devolver una respuesta con código para que el frontend muestre una alerta adecuada
          return NextResponse.json({ error: "Contraseña incorrecta", code: "invalid_credentials" }, { status: 401 })
        }

        console.log("✅ Usuario de BD autenticado:", user.email, "Rol:", user.role)

        // Crear token
        const token = createToken(user)

        const response = NextResponse.json({
          success: true,
          message: "Inicio de sesión exitoso",
          event: "login_success",
          user: {
            email: user.email,
            name: user.name,
            role: user.role || "user",
          },
          token,
          source: "database",
        })

        response.cookies.set("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 días
        })

        return response
      } else {
        console.log("👤 Usuario no encontrado en BD")
        // Usuario no registrado: devolver código específico para que el frontend muestre una alerta
        return NextResponse.json({ error: "Usuario no registrado", code: "not_registered" }, { status: 404 })
      }
    } catch (dbError) {
      console.error("❌ Error de base de datos:", dbError)
      // No hacer fallback a usuarios de prueba. Informar al frontend que el servicio no está disponible.
      return NextResponse.json({ error: "Error de servicio. Intente más tarde.", code: "service_unavailable" }, { status: 503 })
    }
    // Si llegamos aquí, no hubo match y ya se devolvió la respuesta correspondiente.
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
