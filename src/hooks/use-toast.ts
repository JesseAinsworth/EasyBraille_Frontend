"use client"

import { useState, useCallback } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: ToastType
  duration?: number
}

type ToastInput = Omit<Toast, "id"> & {
  variant?: "default" | "destructive"
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: ToastInput) => {
    const id = `toast-${++toastCount}-${Date.now()}`
    
    // Convertir variant a type para compatibilidad
    let type: ToastType = props.type || "info"
    if (props.variant === "destructive") {
      type = "error"
    } else if (props.variant === "default") {
      type = "success"
    }

    const newToast: Toast = {
      ...props,
      id,
      type,
      duration: props.duration || 5000,
    }

    setToasts((prev) => {
      // Evitar duplicados por título y descripción
      if (prev.some(t => t.title === props.title && t.description === props.description)) {
        return prev
      }
      return [...prev, newToast]
    })
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toast, toasts, removeToast }
}
