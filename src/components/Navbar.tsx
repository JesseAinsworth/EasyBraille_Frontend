"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout() // ✅ limpia localStorage y dispara auth-change
    router.push("/") // ✅ redirige al inicio
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-700">
        Hola, {user?.name || user?.email}
      </span>
      <Button variant="destructive" onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </div>
  )
}
