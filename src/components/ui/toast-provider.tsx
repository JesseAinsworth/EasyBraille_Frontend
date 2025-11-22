"use client"

import { useToast } from "@/hooks/use-toast"
import { Toaster } from "./toaster"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast()

  return (
    <>
      {children}
      <Toaster toasts={toasts} onRemove={removeToast} />
    </>
  )
}
