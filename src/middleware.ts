import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register", "/reset-password", "/translator", "/braille-keyboard"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acceso a rutas públicas y recursos estáticos
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route)) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") // Permitir archivos estáticos
  ) {
    return NextResponse.next()
  }

  // Verificar token de autenticación
  const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(" ")[1]

  if (!token) {
    // Redirigir a login si no hay token
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(pathname)}`, request.url))
  }

  try {
    // Verificar y decodificar el token
    const decoded = verify(token, JWT_SECRET)

    // Verificar acceso a rutas de administrador
    if (pathname.startsWith("/admin") && (decoded as any).role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Error en middleware:", error)
    // Token inválido o expirado
    return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(pathname)}`, request.url))
  }
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
}
