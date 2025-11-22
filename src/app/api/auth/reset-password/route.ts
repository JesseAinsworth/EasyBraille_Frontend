import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("🔄 Proxying reset-password request to backend", body)

    const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")
    
    // Si la respuesta es HTML (error del servidor), loguear el error
    if (contentType && contentType.includes("text/html")) {
      const errorText = await response.text()
      console.error("❌ Backend returned HTML error:", errorText.substring(0, 500))
      return NextResponse.json(
        { error: "El endpoint de restablecimiento de contraseña no está disponible en el backend" }, 
        { status: 503 }
      )
    }

    const data = await response.json()
    console.log("✅ Backend response:", response.status, data)
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("❌ Reset password proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Error al restablecer la contraseña" }, 
      { status: 500 }
    )
  }
}
