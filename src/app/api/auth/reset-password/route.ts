import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("🔄 Proxying reset-password request to backend")

    const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("❌ Reset password proxy error:", error)
    return NextResponse.json(
      { error: "Error al restablecer la contraseña" }, 
      { status: 500 }
    )
  }
}
