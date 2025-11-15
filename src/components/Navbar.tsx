"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/UserNav"
import { Menu, X } from "lucide-react"
import { LogoSection } from "@/components/LogoSection"
import { useAuth } from "@/hooks/use-auth"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) return null

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <LogoSection
              size="small"
              showText={true}
              src="/images/easybraillenormal-1.png"
              alt="EasyBraille"
            />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/translator" className="text-gray-600 hover:text-gray-900 transition-colors">
              Traductor
            </Link>
            <Link href="/history" className="text-gray-600 hover:text-gray-900 transition-colors">
              Historial
            </Link>

            {user ? (
              <UserNav />
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button>Registrarse</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            {user && <UserNav />}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link href="/translator" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" onClick={closeMenu}>
              Traductor
            </Link>
            <Link href="/history" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" onClick={closeMenu}>
              Historial
            </Link>
            {!user && (
              <>
                <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" onClick={closeMenu}>
                  Iniciar Sesión
                </Link>
                <Link href="/register" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" onClick={closeMenu}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div
