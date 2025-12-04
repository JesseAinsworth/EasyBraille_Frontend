"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Shield, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Debug: Log cuando cambia el estado del usuario
  useEffect(() => {
    console.log("👤 UserNav - Usuario:", user)
  }, [user])

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      
      logout()
      
      toast({
        title: "👋 Sesión cerrada",
        description: "Has cerrado sesión exitosamente. ¡Hasta pronto!",
        type: "success",
        duration: 3000
      })
      
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      
      // Aún así cerrar sesión localmente
      logout()
      
      toast({
        title: "ℹ️ Sesión cerrada",
        description: "Tu sesión ha sido cerrada localmente.",
        type: "info",
        duration: 3000
      })
      
      router.push("/login")
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} alt={user?.name || "Usuario"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              <span>Panel de Administración</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
