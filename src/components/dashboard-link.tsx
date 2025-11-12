"use client"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavTransition } from "@/hooks/use-transition"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { ReactNode } from "react"

interface DashboardLinkProps {
  href: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Componente optimizado para enlaces del dashboard
 * Incluye prefetching, transiciones y estados de carga
 */
export function DashboardLink({ href, icon, children, className }: DashboardLinkProps) {
  const pathname = usePathname()
  const { isPending, isNavigating, navigateTo } = useNavTransition()
  const isActive = pathname === href

  return (
    <button
      onClick={() => navigateTo(href)}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
        (isPending || isNavigating) && "opacity-80",
        className,
      )}
    >
      <span className="flex items-center justify-center w-5 h-5">
        {(isPending || isNavigating) && href === pathname ? <LoadingSpinner size="sm" /> : icon}
      </span>
      <span>{children}</span>
    </button>
  )
}
