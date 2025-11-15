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
    
    const backendUrl = `${BACKEND_URL}/api/auth/register`
    console.log(`🔄 Proxying POST /api/auth/register → ${backendUrl}`)

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
    console.log(`📋 Backend response:`, data.substring(0, 200))
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("❌ Register proxy error:", error)
    
    // If backend is not available, provide mock response for development
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('🔧 Backend not available, providing mock response')
      
      const { name, email, password } = requestBodyJson || {}
      
      if (!name || !email || !password) {
        return NextResponse.json({
          error: 'ValidationError',
          message: 'Nombre, email y contraseña son requeridos'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        message: 'Usuario registrado exitosamente (modo desarrollo)',
        user: {
          id: 'dev-user-id',
          name,
          email,
          role: 'user',
          language: 'es',
          theme: 'light',
          learningLevel: 'beginner',
          totalTranslations: 0,
          totalKeyboardPractice: 0,
          streakDays: 0,
          isEmailVerified: false,
          lastLoginAt: null
        },
        tokens: {
          accessToken: 'dev-access-token',
          refreshToken: 'dev-refresh-token',
          expiresIn: '15m'
        }
      }, { status: 201 })
    }
    
    return NextResponse.json(
      { 
        error: "Error en el proxy de registro", 
        details: error.message,
        type: error.name 
      }, 
      { status: 500 }
    )
  }
}