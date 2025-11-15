import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`
    
    console.log(`🔄 Proxying POST ${url.pathname} → ${backendUrl}`)

    const body = await request.text()

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "Accept": request.headers.get("Accept") || "application/json",
      },
      body,
    })

    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (error: any) {
    console.error("❌ Proxy error:", error)
    return NextResponse.json(
      { error: "Error en el proxy al backend" }, 
      { status: 500 }
    )
  }
}