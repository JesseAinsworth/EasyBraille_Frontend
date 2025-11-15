"use client"

import { useState, useEffect } from "react"

interface User {
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
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser))
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Load user on mount
    loadUser()

    // Listen for storage changes (including from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") {
        loadUser()
      }
    }

    // Listen for custom auth events
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

  const login = (userData: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    setUser(userData)
    
    // Trigger auth change event
    window.dispatchEvent(new Event("auth-change"))
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    
    // Trigger auth change event
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