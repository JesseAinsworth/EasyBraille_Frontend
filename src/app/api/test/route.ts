import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function GET(request: NextRequest) {
  try {
    console.log(`🧪 Testing connection to: ${BACKEND_URL}`)
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    })

    const data = await response.text()
    
    return NextResponse.json({
      message: "Test de conexión al backend",
      backendUrl: BACKEND_URL,
      status: response.status,
      response: data.substring(0, 500),
      success: response.ok
    })
  } catch (error: any) {
    console.error("❌ Connection test error:", error)
    return NextResponse.json({
      message: "Error de conexión al backend",
      backendUrl: BACKEND_URL,
      error: error.message,
      success: false
    }, { status: 500 })
  }
}