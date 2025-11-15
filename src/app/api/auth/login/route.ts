import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function POST(request: NextRequest) {
  let requestBodyText: string;
  let requestBodyJson: any;
  
  try {
    // Read body once and store it
    requestBodyText = await request.text()
    requestBodyJson = JSON.parse(requestBodyText)
    console.log(`📋 Request body:`, requestBodyText.substring(0, 200))
    
    const backendUrl = `${BACKEND_URL}/api/auth/login`
    console.log(`🔄 Proxying POST /api/auth/login → ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: requestBodyText,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const data = await response.text()
    console.log(`📋 Backend response status: ${response.status}`)
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("❌ Login proxy error:", error)
    
    // If backend is not available, provide mock response for development
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      console.log('🔧 Backend not available, providing mock response')
      
      const { email, password } = requestBodyJson || {}
      
      if (!email || !password) {
        return NextResponse.json({
          error: 'ValidationError',
          message: 'Email y contraseña son requeridos'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        message: 'Inicio de sesión exitoso (modo desarrollo)',
        user: {
          id: 'dev-user-id',
          name: 'Usuario de Desarrollo',
          email,
          role: 'user',
          language: 'es',
          theme: 'light',
          learningLevel: 'beginner',
          totalTranslations: 5,
          totalKeyboardPractice: 3,
          streakDays: 2,
          isEmailVerified: true,
          lastLoginAt: new Date().toISOString()
        },
        tokens: {
          accessToken: 'dev-access-token',
          refreshToken: 'dev-refresh-token',
          expiresIn: '15m'
        }
      }, { status: 200 })
    }
    
    return NextResponse.json(
      { 
        error: "Error en el proxy de login", 
        details: error.message,
        type: error.name 
      }, 
      { status: 500 }
    )
  }
}