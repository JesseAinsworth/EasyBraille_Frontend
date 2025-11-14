import { type NextRequest, NextResponse } from "next/server"
import { getTranslationById, deleteTranslation } from "@/services/translationService"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const translation = await getTranslationById(params.id)

    if (!translation) {
      return NextResponse.json({ error: "Traducción no encontrada" }, { status: 404 })
    }

    // Verificar que la traducción pertenezca al usuario
    if (translation.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(translation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener traducción" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const translation = await getTranslationById(params.id)

    if (!translation) {
      return NextResponse.json({ error: "Traducción no encontrada" }, { status: 404 })
    }

    // Verificar que la traducción pertenezca al usuario
    if (translation.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const success = await deleteTranslation(params.id)

    if (!success) {
      return NextResponse.json({ error: "Error al eliminar traducción" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar traducción" }, { status: 500 })
  }
}
