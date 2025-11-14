import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { getUsersCollection } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea administrador
    const user = await getUserFromToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    console.log("🔍 Cargando usuarios desde la base de datos...")

    // Obtener la colección de usuarios
    const usersCollection = await getUsersCollection()

    // Obtener todos los usuarios
    const users = await usersCollection.find({}).toArray()

    console.log(`✅ ${users.length} usuarios encontrados en la base de datos`)

    // Estadísticas de usuarios
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.isActive !== false).length
    const adminUsers = users.filter((u) => u.role === "admin").length
    const regularUsers = users.filter((u) => u.role !== "admin").length

    // Formatear usuarios para el frontend
    const formattedUsers = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name || "Sin nombre",
      email: user.email || "Sin email",
      role: user.role || "user",
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      isActive: user.isActive !== false,
    }))

    console.log("📊 Estadísticas de usuarios:", {
      total: totalUsers,
      active: activeUsers,
      admins: adminUsers,
      regular: regularUsers,
    })

    return NextResponse.json({
      users: formattedUsers,
      stats: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        regular: regularUsers,
      },
      isMockData: false,
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)

    return NextResponse.json(
      {
        error: "Error al cargar usuarios",
        details: error instanceof Error ? error.message : "Error desconocido",
        users: [],
        stats: {
          total: 0,
          active: 0,
          admins: 0,
          regular: 0,
        },
        isMockData: true,
      },
      { status: 500 },
    )
  }
}
