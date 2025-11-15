import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET")
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST")
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, "PUT")
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE")
}

async function proxyRequest(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url)
    const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`
    
    console.log(`🔄 Proxying ${method} ${url.pathname} → ${backendUrl}`)

    const body = method !== "GET" && method !== "DELETE" ? await request.text() : undefined

    const response = await fetch(backendUrl, {
      method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "Accept": request.headers.get("Accept") || "application/json",
        // Forward authorization headers if present
        ...(request.headers.get("Authorization") && {
          "Authorization": request.headers.get("Authorization")!
        }),
      },
      body,
    })

    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        // Forward CORS headers if present
        ...(response.headers.get("Access-Control-Allow-Origin") && {
          "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin")!
        }),
      },
    })
  } catch (error) {
    console.error("❌ Proxy error:", error)
    return NextResponse.json(
      { error: "Error en el proxy al backend" }, 
      { status: 500 }
    )
  }
}