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

    const flaskResponse = await fetch("http://localhost:5000/api/translate", {
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
