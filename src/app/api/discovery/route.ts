import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function GET(request: NextRequest) {
  try {
    console.log(`🧪 Testing backend endpoints...`)
    
    // Test different possible endpoints
    const testEndpoints = [
      '/api/auth/register',
      '/api/register', 
      '/auth/register',
      '/register',
      '/api/users/register',
      '/api/user/register',
      '/',
      '/health'
    ]
    
    const results = []
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
        })
        
        const text = await response.text()
        results.push({
          endpoint,
          status: response.status,
          contentType: response.headers.get('content-type'),
          preview: text.substring(0, 100),
          isHtml: text.startsWith('<!doctype') || text.startsWith('<html')
        })
      } catch (error: any) {
        results.push({
          endpoint,
          status: 'ERROR',
          error: error?.message || 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      message: "Backend endpoint discovery",
      backendUrl: BACKEND_URL,
      results
    })
  } catch (error: any) {
    console.error("❌ Discovery error:", error)
    return NextResponse.json({
      error: "Error testing backend endpoints",
      details: error.message
    }, { status: 500 })
  }
}