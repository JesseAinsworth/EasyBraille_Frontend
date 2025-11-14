import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { hash } from "bcryptjs"

// Endpoint para probar operaciones de usuario directamente
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Iniciando operación de usuario directa")

    const data = await request.json()
    console.log("📦 DEBUG: Datos recibidos:", JSON.stringify(data))

    const usersCollection = await getUsersCollection()
    console.log("✅ DEBUG: Colección de usuarios obtenida")

    const hashedPassword = await hash(data.password || "password123", 10)

    const newUser = {
      name: data.name || "Usuario de Prueba",
      email: data.email || `test${Date.now()}@example.com`,
      password: hashedPassword,
      role: data.role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("📝 DEBUG: Intentando insertar usuario:", newUser.email)

    const result = await usersCollection.insertOne(newUser)

    console.log("✅ DEBUG: Usuario insertado correctamente:", result.insertedId)

    return NextResponse.json({
      success: true,
      message: "Usuario creado correctamente",
      userId: result.insertedId.toString(),
      email: newUser.email,
    })
  } catch (error: any) {
    console.error("❌ DEBUG ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Endpoint para probar la actualización de un usuario
export async function PUT(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Iniciando actualización de usuario directa")

    const data = await request.json()
    console.log("📦 DEBUG: Datos recibidos:", JSON.stringify(data))

    if (!data.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere userId",
        },
        { status: 400 },
      )
    }

    let userId: ObjectId
    try {
      userId = new ObjectId(data.userId)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "El ID proporcionado no es válido",
        },
        { status: 400 },
      )
    }

    const usersCollection = await getUsersCollection()
    console.log("✅ DEBUG: Colección de usuarios obtenida")

    const updateData = {
      $set: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
        updatedAt: new Date(),
      },
    }

    console.log("📝 DEBUG: Intentando actualizar usuario:", userId)
    console.log("📝 DEBUG: Datos de actualización:", JSON.stringify(updateData))

    const result = await usersCollection.updateOne({ _id: userId }, updateData)

    console.log(
      "✅ DEBUG: Resultado de actualización:",
      JSON.stringify({
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no encontrado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado correctamente",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    })
  } catch (error: any) {
    console.error("❌ DEBUG ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Endpoint para probar la eliminación de un usuario
export async function DELETE(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Iniciando eliminación de usuario directa")

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere id en los parámetros de consulta",
        },
        { status: 400 },
      )
    }

    console.log("📦 DEBUG: ID recibido:", userId)

    let objectId: ObjectId
    try {
      objectId = new ObjectId(userId)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "El ID proporcionado no es válido",
        },
        { status: 400 },
      )
    }

    const usersCollection = await getUsersCollection()
    console.log("✅ DEBUG: Colección de usuarios obtenida")

    console.log("📝 DEBUG: Intentando eliminar usuario:", objectId)

    const result = await usersCollection.deleteOne({ _id: objectId })

    console.log(
      "✅ DEBUG: Resultado de eliminación:",
      JSON.stringify({
        deleted: result.deletedCount,
      }),
    )

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no encontrado o ya eliminado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente",
      deleted: result.deletedCount,
    })
  } catch (error: any) {
    console.error("❌ DEBUG ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Endpoint para obtener todos los usuarios (para depuración)
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Obteniendo todos los usuarios")

    const usersCollection = await getUsersCollection()
    console.log("✅ DEBUG: Colección de usuarios obtenida")

    const users = await usersCollection.find({}).toArray()

    console.log(`✅ DEBUG: ${users.length} usuarios encontrados`)

    const safeUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      password: undefined,
    }))

    return NextResponse.json({
      success: true,
      users: safeUsers,
    })
  } catch (error: any) {
    console.error("❌ DEBUG ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
