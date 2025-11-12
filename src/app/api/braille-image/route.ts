import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: "No se envió imagen válida" }, { status: 400 })
    }

    const body = new FormData()
    body.append("image", imageFile, imageFile.name)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraille-backend.onrender.com"

    const flaskResponse = await fetch(`${API_URL}/api/braille-image`, {
      method: "POST",
      body,
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("Error desde Flask:", errorText)
      return NextResponse.json({ error: "Error en el backend Flask" }, { status: flaskResponse.status })
    }

    const data = await flaskResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al enviar imagen a Flask:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
