import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "user" | "admin"
  avatarUrl?: string
  createdAt: Date
  updatedAt?: Date
  lastLogin?: Date
  isActive: boolean
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: "user" | "admin"
  avatarUrl?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  avatarUrl?: string
  lastLogin?: Date
  isActive?: boolean
  updatedAt: Date
}

// Validación de datos de usuario
export function validateUserData(data: CreateUserData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres")
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push("El email debe tener un formato válido")
  }

  if (!data.password || data.password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
