import { type NextRequest, NextResponse } from "next/server"
import { getTranslationsCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserFromToken } from "@/lib/auth.server"

// GET - Obtener traducciones del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para ver su historial." },
        { status: 401 }
      )
    }

    const translationsCollection = await getTranslationsCollection()
    const userId = new ObjectId(user._id)

    const translations = await translationsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    const formattedTranslations = translations.map((translation) => ({
      ...translation,
      _id: translation._id.toString(),
      userId: translation.userId.toString(),
    }))

    return NextResponse.json({ translations: formattedTranslations })
  } catch (error) {
    console.error("Error fetching translations:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva traducción
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para guardar traducciones." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { originalText, brailleText, translationType, language } = body

    if (!originalText || !brailleText || !translationType) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      )
    }

    const translationsCollection = await getTranslationsCollection()

    const newTranslation = {
      userId: new ObjectId(user._id),
      originalText: originalText.trim(),
      brailleText: brailleText.trim(),
      translationType,
      language: language || "es",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await translationsCollection.insertOne(newTranslation)

    return NextResponse.json({
      success: true,
      message: "Traducción guardada exitosamente",
      translationId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error saving translation:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar traducción
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const translationId = searchParams.get("id")

    if (!translationId) {
      return NextResponse.json(
        { error: "ID de traducción requerido" },
        { status: 400 }
      )
    }

    const translationsCollection = await getTranslationsCollection()

    const result = await translationsCollection.deleteOne({
      _id: new ObjectId(translationId),
      userId: new ObjectId(user._id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Traducción no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Traducción eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error deleting translation:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
