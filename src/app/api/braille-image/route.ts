import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No se envió imagen" }, { status: 400 })
    }

    // Crear un nuevo FormData compatible con node-fetch
    const body = new FormData()
    body.append("image", imageFile, imageFile.name)

    // For braille image detection, we use the Railway backend specifically
    const railwayBackendUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || "https://easybraillebackend-production.up.railway.app"
    const flaskResponse = await fetch(`${railwayBackendUrl}`, {
      method: "POST",
      body, // Sin headers manuales
    })

    const data = await flaskResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al enviar imagen a Flask:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
