import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/services/userService"
import { createToken } from "@/lib/auth.server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 })
    }

    // Crear usuario en la base de datos
    const user = await createUser({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: "user", // Por defecto, todos los usuarios nuevos son "user"
    })

    // Crear token y devolver cookie para login inmediato
    const token = createToken(user)

    const response = NextResponse.json(
      {
        success: true,
        message: "Registro exitoso",
        event: "registered",
        user: {
          id: user._id!.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      { status: 201 },
    )

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    return response
  } catch (error: any) {
    console.error("Error en registro:", error)

    // Manejar errores específicos
    if (
      error.message.includes("El usuario ya existe") ||
      error.message.includes("El email ya está registrado") ||
      error.message.includes("email ya está registrado")
    ) {
      return NextResponse.json({ error: "El usuario ya existe", code: "already_registered" }, { status: 400 })
    }

    if (error.message.includes("Datos inválidos")) {
      return NextResponse.json({ error: error.message, code: "invalid_data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
