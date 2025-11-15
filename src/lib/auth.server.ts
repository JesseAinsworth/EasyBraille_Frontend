import { SignJWT, jwtVerify } from 'jose'
import { getUsersCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Default JWT secret - MUST be overridden in production with JWT_SECRET env var
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "easybraille-jwt-fallback-key-2024"
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Simple credential check placeholder; replace with real DB lookup
        if (!credentials?.email) return null
        const users = await getUsersCollection()
        const user: any = await users.findOne({ email: credentials.email })
        if (user)
          return { id: user._id.toString(), name: user.name, email: user.email, role: user.role || "user" }
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "easybraille-nextauth-fallback-2024",
}

export async function createToken(user: any): Promise<string> {
  const payload = {
    userId: user._id?.toString() || user._id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  }
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
    return null
  }
}

export async function getUserFromToken(tokenOrRequest: any) {
  try {
    let token: string | undefined
    // Accept either Request or token string
    if (typeof tokenOrRequest === "string") token = tokenOrRequest
    else if (tokenOrRequest && tokenOrRequest.cookies) token = tokenOrRequest.cookies.get("token")?.value
    else if (tokenOrRequest && tokenOrRequest.headers) token = tokenOrRequest.headers.get("Authorization")?.replace(/^Bearer\s+/, "")

    if (!token) return null

    const decoded: any = await verifyToken(token)

    if (decoded && decoded.userId) {
      const users = await getUsersCollection()
      const user = await users.findOne({ _id: new ObjectId(decoded.userId) })
      if (user) return { _id: user._id.toString(), email: user.email, name: user.name, role: user.role || "user" }
    }

    return null
  } catch (error) {
    return null
  }
}

// Simple reset token helpers stored in DB (or you can implement in a collection)
export async function generateResetPasswordToken(email: string) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  // save token to a collection or user's doc — simplified here
  const users = await getUsersCollection()
  await users.updateOne({ email }, { $set: { resetToken: token, resetIssuedAt: new Date() } }, { upsert: false })
  return token
}

export async function saveResetToken(email: string, token: string) {
  const users = await getUsersCollection()
  await users.updateOne({ email }, { $set: { resetToken: token, resetIssuedAt: new Date() } })
}

export async function verifyResetToken(token: string) {
  const users = await getUsersCollection()
  const user = await users.findOne({ resetToken: token })
  if (!user) return false
  // token expires in 1 day
  const issued = user.resetIssuedAt ? new Date(user.resetIssuedAt) : null
  if (!issued) return false
  const age = Date.now() - issued.getTime()
  return age < 24 * 60 * 60 * 1000
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const users = await getUsersCollection()
  const user = await users.findOne({ resetToken: token })
  if (!user) return false
  await users.updateOne({ _id: user._id }, { $set: { password: newPassword }, $unset: { resetToken: "", resetIssuedAt: "" } })
  return true
}
