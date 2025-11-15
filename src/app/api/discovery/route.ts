import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export async function GET(request: NextRequest) {
  try {
    console.log(`🧪 Testing backend endpoints...`)
    
    // Temporarily disabled during build due to backend timeout issues
    return NextResponse.json({
      message: "Backend discovery disabled during build",
      backend_url: BACKEND_URL,
      status: "DISABLED_FOR_BUILD",
      reason: "Backend experiencing 500 errors and timeouts",
      endpoints_to_test: [
        '/api/auth/register',
        '/api/auth/login', 
        '/api/translations',
        '/api/braille-image'
      ]
    })
    
    /* 
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
      error: "Discovery disabled during build - Backend timeout issues",
      details: error.message
    }, { status: 503 })
  }
}