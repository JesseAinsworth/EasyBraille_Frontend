"use client"

import { useState } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    setToasts((prev) => {
      // Si el toast ya existe (por título o descripción), no añadirlo
      if (prev.some(t => t.title === props.title && t.description === props.description)) {
        return prev;
      }

      // Agregar nuevo toast al estado
      return [...prev, props]
    })

    // In a real implementation, we would show a toast notification
    // For this demo, we'll just log to console
    console.log(`Toast: ${props.title} - ${props.description}`)

    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== props))
    }, 3000)
  }

  return { toast, toasts }
}
