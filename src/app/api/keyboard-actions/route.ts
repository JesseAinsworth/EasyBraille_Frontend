import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { logKeyboardAction, getRecentKeyboardActions } from "@/lib/keyboardActions"

const validActions = ["keyPress", "delete", "submit", "other"] as const
type ActionType = typeof validActions[number]

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user || !user._id) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { brailleCode, character, actionType, deviceId } = body

    // Validar campos obligatorios
    if (
      typeof brailleCode !== "string" || !brailleCode.trim() ||
      typeof character !== "string" || !character.trim() ||
      typeof actionType !== "string" ||
      !validActions.includes(actionType as ActionType)
    ) {
      return NextResponse.json({ error: "Campos requeridos inválidos o faltantes" }, { status: 400 })
    }

    const keyboardAction = await logKeyboardAction({
      userId: user._id.toString(),
      brailleCode: brailleCode.trim(),
      character: character.trim(),
      actionType: actionType as ActionType,
      timestamp: new Date(),
      deviceId: typeof deviceId === "string" ? deviceId : undefined, // opcional
    })

    return NextResponse.json(keyboardAction, { status: 201 })
  } catch (error: any) {
    console.error("❌ Error al registrar acción del teclado:", error)
    return NextResponse.json(
      { error: error.message || "Error al registrar acción del teclado" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const limitParam = request.nextUrl.searchParams.get("limit") || "100"
    const limit = Number.parseInt(limitParam)
    const maxLimit = 1000

    if (isNaN(limit) || limit <= 0 || limit > maxLimit) {
      return NextResponse.json({ error: `El parámetro 'limit' debe ser un número entre 1 y ${maxLimit}` }, { status: 400 })
    }

    const actions = await getRecentKeyboardActions(limit)

    return NextResponse.json(actions)
  } catch (error: any) {
    console.error("❌ Error al obtener acciones del teclado:", error)
    return NextResponse.json(
      { error: error.message || "Error al obtener acciones del teclado" },
      { status: 500 }
    )
  }
}
