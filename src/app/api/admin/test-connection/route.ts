import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing backend connection...")
    
    // Probar múltiples endpoints
    const endpoints = [
      "/api/admin/users",
      "/api/admin/stats",
      "/api/translations",
    ]
    
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const url = `${BACKEND_URL}${endpoint}`
          console.log(`📡 Testing: ${url}`)
          
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
          
          const text = await response.text()
          let data
          try {
            data = JSON.parse(text)
          } catch {
            data = text
          }
          
          return {
            endpoint,
            status: response.status,
            ok: response.ok,
            data: response.ok ? data : null,
            error: !response.ok ? text : null,
          }
        } catch (error: any) {
          return {
            endpoint,
            status: 0,
            ok: false,
            data: null,
            error: error.message,
          }
        }
      })
    )
    
    console.log("✅ Test results:", results)
    
    return NextResponse.json({
      message: "Connection test completed",
      backendUrl: BACKEND_URL,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Test error:", error)
    return NextResponse.json(
      { error: "Error testing connection", details: error.message },
      { status: 500 }
    )
  }
}
