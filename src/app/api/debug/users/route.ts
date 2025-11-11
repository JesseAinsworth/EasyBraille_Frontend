import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const usersCollection = await getUsersCollection()

    // Obtener todos los usuarios (sin contraseñas para seguridad)
    const users = await usersCollection
      .find(
        {},
        {
          projection: {
            password: 0, // No incluir contraseñas en la respuesta
          },
        },
      )
      .toArray()

    // Contar usuarios por rol
    const userStats = {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      users: users.filter((u) => u.role === "user").length,
      active: users.filter((u) => u.isActive !== false).length,
    }

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
        hasPassword: true, // Indicar que tiene contraseña sin mostrarla
      })),
      stats: userStats,
    })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json()

    if (action === "test-password") {
      // Probar si una contraseña coincide con un usuario
      const usersCollection = await getUsersCollection()
      const user = await usersCollection.findOne({ email })

      if (!user) {
        return NextResponse.json({
          success: false,
          message: "Usuario no encontrado",
        })
      }

      const isValid = await bcrypt.compare(password, user.password)

      return NextResponse.json({
        success: true,
        passwordValid: isValid,
        user: {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
      })
    }

    if (action === "create-test-user") {
      // Crear un usuario de prueba con contraseña hasheada
      const usersCollection = await getUsersCollection()

      // Verificar si ya existe
      const existingUser = await usersCollection.findOne({ email })
      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: "El usuario ya existe",
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = {
        name: email.includes("admin") ? "Administrador DB" : "Usuario DB",
        email,
        password: hashedPassword,
        role: email.includes("admin") ? "admin" : "user",
        createdAt: new Date(),
        isActive: true,
      }

      const result = await usersCollection.insertOne(newUser)

      return NextResponse.json({
        success: true,
        message: "Usuario creado exitosamente",
        userId: result.insertedId.toString(),
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Acción no válida",
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error("Error in user debug API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
