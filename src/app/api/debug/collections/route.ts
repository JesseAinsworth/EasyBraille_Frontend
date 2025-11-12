import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()

    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((col) => col.name)

    // Para cada colección, obtener un conteo y una muestra
    const collectionData = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const collection = db.collection(name)
          const count = await collection.countDocuments()
          const sample = await collection.find().limit(1).toArray()

          return {
            name,
            count,
            hasDocuments: count > 0,
            sample: sample.length > 0 ? sanitizeDocument(sample[0]) : null,
            error: null,
          }
        } catch (error: any) {
          return {
            name,
            count: 0,
            hasDocuments: false,
            sample: null,
            error: error.message,
          }
        }
      }),
    )

    return NextResponse.json({
      databaseName: db.databaseName,
      collections: collectionData,
      totalCollections: collectionNames.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        status: "error",
      },
      { status: 500 },
    )
  }
}

// Función para sanitizar documentos (eliminar contraseñas, etc.)
function sanitizeDocument(doc: any) {
  if (!doc) return null

  const sanitized = { ...doc }

  // Convertir ObjectId a string
  if (sanitized._id) {
    sanitized._id = sanitized._id.toString()
  }

  // Ocultar contraseñas
  if (sanitized.password) {
    sanitized.password = "***"
  }

  return sanitized
}
