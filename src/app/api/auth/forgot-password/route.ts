import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("🔄 Proxying forgot-password request to backend")

    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("❌ Forgot password proxy error:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud de recuperación de contraseña" }, 
      { status: 500 }
    )
  }
}
