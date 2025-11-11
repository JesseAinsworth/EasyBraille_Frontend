import { NextResponse } from "next/server"

export async function GET() {
  const response = NextResponse.json({ success: true })

  // Eliminar la cookie del token
  response.cookies.set({
    name: "token",
    value: "",
    maxAge: 0,
    path: "/",
  })

  return response
}
