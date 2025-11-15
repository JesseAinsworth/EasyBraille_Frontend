import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from "next/server"
import { getUsersCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET)

export interface AuthUser {
  _id: ObjectId | string
  email: string
  name: string
  role: string
}

export async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Intentar obtener el token de las cookies primero
    let token = request.cookies.get("token")?.value

    // Si no hay token en cookies, intentar obtenerlo del header Authorization
    if (!token) {
      const authHeader = request.headers.get("Authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    // También intentar obtener el token desde localStorage (para casos de SPA)
    if (!token) {
      const authFromBody = request.headers.get("x-auth-token")
      if (authFromBody) {
        token = authFromBody
      }
    }

    if (!token) {
      console.log("❌ No se encontró token de autenticación")
      return null
    }

    console.log("🔍 Token encontrado, verificando...")

    // Verificar el token
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    const decoded = payload as any
    console.log("✅ Token verificado:", { email: decoded.email, role: decoded.role })

    // Si el token contiene información completa del usuario, devolverla
    if (decoded.email && decoded.name && decoded.role) {
      // Manejar IDs de usuarios de prueba
      let userId: ObjectId | string
      if (decoded.userId === "admin_id" || decoded.userId === "user_id" || typeof decoded.userId === "string") {
        // Para usuarios de prueba o IDs que no son ObjectId válidos
        userId = decoded.userId
      } else {
        try {
          // Intentar crear ObjectId solo si es un formato válido
          userId = new ObjectId(decoded.userId)
        } catch (error) {
          // Si falla, usar el string tal como está
          userId = decoded.userId
        }
      }

      return {
        _id: userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }
    }

    // Si solo tiene userId, buscar el usuario en la base de datos
    if (decoded.userId) {
      // Solo buscar en la base de datos si el userId es un ObjectId válido
      if (decoded.userId !== "admin_id" && decoded.userId !== "user_id") {
        try {
          const usersCollection = await getUsersCollection()
          const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })

          if (user) {
            return {
              _id: user._id,
              email: user.email,
              name: user.name,
              role: user.role || "user",
            }
          }
        } catch (error) {
          console.error("Error fetching user from database:", error)
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export async function createToken(user: any): Promise<string> {
  const payload = {
    userId: user._id?.toString() || user._id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  }

  console.log("🔐 Creando token para:", { email: payload.email, role: payload.role })

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET_KEY)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    return payload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
