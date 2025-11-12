import type { ObjectId } from "mongodb"

// Tipos de traducción
export type TranslationType = "TEXT_TO_BRAILLE" | "BRAILLE_TO_TEXT" | "IMAGE_TO_BRAILLE"

// Interfaz para el modelo de traducción
export interface Translation {
  _id: ObjectId | string
  userId: ObjectId | string
  originalText: string
  brailleText: string
  translationType: TranslationType
  language: string
  imageUrl?: string | null
  createdAt: Date
}

// Interfaz para crear una nueva traducción
export interface CreateTranslationData {
  userId: string
  originalText: string
  brailleText: string
  translationType: TranslationType
  language?: string
  imageUrl?: string | null
}

// Validación de datos de traducción
export function validateTranslationData(data: CreateTranslationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar campos requeridos
  if (!data.userId) errors.push("ID de usuario es requerido")
  if (!data.originalText) errors.push("Texto original es requerido")
  if (!data.brailleText) errors.push("Texto en braille es requerido")

  // Validar tipo de traducción
  if (!data.translationType) {
    errors.push("Tipo de traducción es requerido")
  } else if (!["TEXT_TO_BRAILLE", "BRAILLE_TO_TEXT", "IMAGE_TO_BRAILLE"].includes(data.translationType)) {
    errors.push("Tipo de traducción inválido")
  }

  // Validar longitud máxima
  if (data.originalText && data.originalText.length > 10000) {
    errors.push("El texto original excede el límite de 10000 caracteres")
  }

  if (data.brailleText && data.brailleText.length > 20000) {
    errors.push("El texto en braille excede el límite de 20000 caracteres")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
