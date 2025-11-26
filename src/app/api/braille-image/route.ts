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
    console.log("📦 Tamaño de imagen:", imageFile.size, "bytes")
    
    // Timeout más largo para cold starts de Render (60 segundos)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)
    
    try {
      const aiResponse = await fetch(`${aiApiUrl}/predict`, {
        method: "POST",
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error("❌ AI API error response:", errorText)
        throw new Error(`AI API respondió con status ${aiResponse.status}: ${errorText}`)
      }

      const data = await aiResponse.json()
      
      console.log("📥 Respuesta de AI API:", data)
      
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error("⏱️ Timeout: La API de IA tardó más de 60 segundos")
        return NextResponse.json({ 
          error: "La API de IA está tardando mucho. Puede estar iniciándose (cold start). Intenta nuevamente en 10 segundos.", 
          details: "Timeout después de 60 segundos"
        }, { status: 504 })
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error("❌ Error al procesar imagen con AI:", error)
    return NextResponse.json({ 
      error: "Error al procesar la imagen", 
      details: error.message 
    }, { status: 500 })
  }
}
