import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth.server"
import { getUsersCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { hash } from "bcryptjs"

// Endpoint para crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API: Creando nuevo usuario...")

    // Verificar que el usuario sea administrador
    const adminUser = await getUserFromToken(request)

    if (!adminUser || adminUser.role !== "admin") {
      console.log("❌ API: Acceso denegado - No es administrador")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userData = await request.json()
    console.log(
      "📦 API: Datos recibidos:",
      JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hasPassword: !!userData.password,
      }),
    )

    // Obtener la colección de usuarios directamente
    const usersCollection = await getUsersCollection()
    console.log("✅ API: Colección de usuarios obtenida")

    // Verificar si el email ya existe
    const existingUser = await usersCollection.findOne({ email: userData.email })
    if (existingUser) {
      console.log("❌ API: Email ya registrado:", userData.email)
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    // Asegurarse de que haya una contraseña
    const password = userData.password || "password123"
    console.log("🔑 API: Usando contraseña:", userData.password ? "personalizada" : "predeterminada (password123)")

    // Crear hash de la contraseña
    const hashedPassword = await hash(password, 10)
    console.log("🔒 API: Contraseña hasheada correctamente")

    // Preparar el nuevo usuario
    const newUser = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    console.log("📝 API: Insertando nuevo usuario...")

    // Insertar el usuario directamente
    const result = await usersCollection.insertOne(newUser)

    console.log("✅ API: Usuario creado con ID:", result.insertedId)

    return NextResponse.json({
      success: true,
      user: {
        _id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        password: userData.password ? undefined : "password123", // Devolver la contraseña predeterminada si se usó
      },
    })
  } catch (error: any) {
    console.error("❌ API ERROR al crear usuario:", error)

    let errorMessage = error.message || "Error al crear usuario"
    const statusCode = 500

    if (error.name === "MongoNetworkError" || error.message.includes("ENOTFOUND")) {
      errorMessage = "Error de conexión a la base de datos. Por favor, verifica la configuración."
      console.error("❌ Error de conexión a MongoDB:", error.message)
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

// Endpoint para actualizar un usuario existente
export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 API: Actualizando usuario...")

    // Verificar que el usuario sea administrador
    const adminUser = await getUserFromToken(request)

    if (!adminUser || adminUser.role !== "admin") {
      console.log("❌ API: Acceso denegado - No es administrador")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userData = await request.json()
    console.log(
      "📦 API: Datos recibidos:",
      JSON.stringify({
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      }),
    )

    if (!userData.userId) {
      console.log("❌ API: Falta ID de usuario")
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 })
    }

    if (!ObjectId.isValid(userData.userId)) {
      console.log("❌ API: ID de usuario no válido:", userData.userId)
      return NextResponse.json({ error: "ID de usuario no válido" }, { status: 400 })
    }

    const userId = new ObjectId(userData.userId)

    // Preparar datos de actualización
    const updateData = {
      $set: {
        ...(userData.name && { name: userData.name }),
        ...(userData.email && { email: userData.email }),
        ...(userData.role && { role: userData.role }),
        updatedAt: new Date(),
      },
    }

    const usersCollection = await getUsersCollection()
    console.log("✅ API: Colección de usuarios obtenida")
    console.log("📝 API: Actualizando usuario:", userId)
    console.log("📝 API: Datos de actualización:", JSON.stringify(updateData))

    // Actualizar el usuario directamente
    const result = await usersCollection.updateOne({ _id: userId }, updateData)

    console.log(
      "✅ API: Resultado de actualización:",
      JSON.stringify({
        matched: result.matchedCount,
        modified: result.modifiedCount,
      }),
    )

    if (result.matchedCount === 0) {
      console.log("❌ API: Usuario no encontrado:", userId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener el usuario actualizado
    const updatedUser = await usersCollection.findOne({ _id: userId })

    if (!updatedUser) {
      console.log("⚠️ API: Usuario actualizado pero no se pudo recuperar")
      return NextResponse.json({
        success: true,
        message: "Usuario actualizado pero no se pudo recuperar los detalles",
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("❌ API ERROR al actualizar usuario:", error)

    let errorMessage = error.message || "Error al actualizar usuario"
    const statusCode = 500

    if (error.name === "MongoNetworkError" || error.message.includes("ENOTFOUND")) {
      errorMessage = "Error de conexión a la base de datos. Por favor, verifica la configuración."
      console.error("❌ Error de conexión a MongoDB:", error.message)
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

// Endpoint para eliminar un usuario
export async function DELETE(request: NextRequest) {
  try {
    console.log("🔄 API: Eliminando usuario...")

    // Verificar que el usuario sea administrador
    const adminUser = await getUserFromToken(request)

    if (!adminUser || adminUser.role !== "admin") {
      console.log("❌ API: Acceso denegado - No es administrador")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    console.log("📦 API: ID recibido:", userId)

    if (!userId || !ObjectId.isValid(userId)) {
      console.log("❌ API: ID de usuario no válido o faltante")
      return NextResponse.json({ error: "ID de usuario no válido" }, { status: 400 })
    }

    const objectId = new ObjectId(userId)

    const usersCollection = await getUsersCollection()
    console.log("✅ API: Colección de usuarios obtenida")

    // Verificar si el usuario existe antes de intentar eliminarlo
    const userExists = await usersCollection.findOne({ _id: objectId })
    if (!userExists) {
      console.log("❌ API: Usuario no encontrado:", objectId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Eliminar el usuario directamente
    const result = await usersCollection.deleteOne({ _id: objectId })

    console.log(
      "✅ API: Resultado de eliminación:",
      JSON.stringify({
        deleted: result.deletedCount,
      }),
    )

    if (result.deletedCount === 0) {
      console.log("❌ API: Usuario no encontrado o ya eliminado:", objectId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ API ERROR al eliminar usuario:", error)

    let errorMessage = error.message || "Error al eliminar usuario"
    const statusCode = 500

    if (error.name === "MongoNetworkError" || error.message.includes("ENOTFOUND")) {
      errorMessage = "Error de conexión a la base de datos. Por favor, verifica la configuración."
      console.error("❌ Error de conexión a MongoDB:", error.message)
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
