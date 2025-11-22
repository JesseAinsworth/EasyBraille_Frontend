"use client"

import { useState, useEffect } from "react"

interface User {
  userId?: string   // ✅ importante para guardar el ID
  name: string
  email: string
  role: string
  avatarUrl?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")

        console.log("🔍 useAuth - Cargando usuario:", { storedUser, token })

        if (storedUser && token) {
          const userData = JSON.parse(storedUser)
          console.log("✅ useAuth - Usuario encontrado:", userData)
          setUser(userData)
        } else {
          console.log("❌ useAuth - No hay usuario")
          setUser(null)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // 🔄 Cargar usuario al montar
    loadUser()

    // 🔄 Escuchar cambios en localStorage (otras pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") {
        loadUser()
      }
    }

    // 🔄 Escuchar eventos personalizados de auth
    const handleAuthChange = () => {
      loadUser()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("auth-change", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [])

  // ✅ Login: guarda usuario y token
  const login = (userData: User, token: string) => {
    console.log("🔐 useAuth.login - Guardando usuario:", userData)
    
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    
    // Actualizar el estado inmediatamente
    setUser(userData)
    setIsLoading(false)

    console.log("✅ useAuth.login - Usuario guardado y estado actualizado")

    // Solo disparar evento auth-change (no storage para evitar loops)
    window.dispatchEvent(new Event("auth-change"))
  }

  // ✅ Logout: limpia sesión
  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)

    window.dispatchEvent(new Event("auth-change"))
  }

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }
}
