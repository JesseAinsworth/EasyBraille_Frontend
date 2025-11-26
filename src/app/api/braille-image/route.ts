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

    // 🤖 Usar la nueva API de IA en Render para detección de Braille
    const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://easybraille-api.onrender.com"
    
    console.log("📤 Enviando imagen a AI API:", aiApiUrl)
    
    const aiResponse = await fetch(`${aiApiUrl}/predict`, {
      method: "POST",
      body, // Sin headers manuales - FormData establece el boundary automáticamente
    })

    if (!aiResponse.ok) {
      throw new Error(`AI API respondió con status ${aiResponse.status}`)
    }

    const data = await aiResponse.json()
    
    console.log("📥 Respuesta de AI API:", data)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("❌ Error al procesar imagen con AI:", error)
    return NextResponse.json({ 
      error: "Error al procesar la imagen", 
      details: error.message 
    }, { status: 500 })
  }
}
