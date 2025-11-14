import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/services/userService"

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
      email,
      password,
      role: "user", // Por defecto, todos los usuarios nuevos son "user"
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id!.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error en registro:", error)

    // Manejar errores específicos
    if (error.message.includes("El usuario ya existe")) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 })
    }

    if (error.message.includes("Datos inválidos")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
