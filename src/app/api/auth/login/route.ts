import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { createToken } from "@/lib/auth"

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
          // No hacer fallback a usuarios de prueba si el usuario existe en BD
          return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
        }

        console.log("✅ Usuario de BD autenticado:", user.email, "Rol:", user.role)

        // Crear token
        const token = createToken(user)

        const response = NextResponse.json({
          success: true,
          message: "Inicio de sesión exitoso",
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
        console.log("👤 Usuario no encontrado en BD, probando usuarios de prueba...")
      }
    } catch (dbError) {
      console.error("❌ Error de base de datos:", dbError)
      console.log("⚠️ Fallback a usuarios de prueba debido a error de BD")
    }

    // Fallback a usuarios de prueba solo si no se encontró en BD o hay error de BD
    const testUsers = [
      { email: "admin@example.com", password: "admin123", name: "Administrador", role: "admin" },
      { email: "user@example.com", password: "user123", name: "Usuario", role: "user" },
    ]

    const testUser = testUsers.find((u) => u.email === email && u.password === password)
    if (testUser) {
      console.log("✅ Usuario de prueba autenticado:", testUser.email, "Rol:", testUser.role)

      const token = createToken({
        _id: testUser.email === "admin@example.com" ? "admin_id" : "user_id",
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      })

      const response = NextResponse.json({
        success: true,
        message: "Inicio de sesión exitoso (usuario de prueba)",
        user: {
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
        token,
        source: "test",
      })

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    }

    console.log("❌ Credenciales incorrectas para:", email)
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
