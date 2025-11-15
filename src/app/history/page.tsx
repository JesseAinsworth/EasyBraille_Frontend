"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Translation {
  _id: string
  originalText: string
  brailleText: string
  translationType: "TEXT_TO_BRAILLE" | "BRAILLE_TO_TEXT"
  language: string
  createdAt: string
}

export default function HistoryPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "TEXT_TO_BRAILLE" | "BRAILLE_TO_TEXT">("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    try {
      setUser(JSON.parse(storedUser))
      fetchTranslations()
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    // Filtrar traducciones
    let filtered = translations

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.brailleText.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterType !== "ALL") {
      filtered = filtered.filter((t) => t.translationType === filterType)
    }

    setFilteredTranslations(filtered)
  }, [translations, searchTerm, filterType])

  const fetchTranslations = async () => {
    try {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
  const response = await fetch(`${BACKEND_URL}/api/translations`)
      if (!response.ok) {
        throw new Error("Error al cargar traducciones")
      }

      const data = await response.json()
      setTranslations(data.translations || [])
    } catch (error) {
      console.error("Error fetching translations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las traducciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTranslation = async (id: string) => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`${BACKEND_URL}/api/translations?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar traducción")
      }

      setTranslations(translations.filter((t) => t._id !== id))
      toast({
        title: "Eliminado",
        description: "Traducción eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error deleting translation:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la traducción",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Historial de Traducciones</h1>
          <p>Cargando traducciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Historial de Traducciones</h1>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en traducciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant={filterType === "ALL" ? "default" : "outline"} onClick={() => setFilterType("ALL")} size="sm">
            Todas
          </Button>
          <Button
            variant={filterType === "TEXT_TO_BRAILLE" ? "default" : "outline"}
            onClick={() => setFilterType("TEXT_TO_BRAILLE")}
            size="sm"
          >
            Texto → Braille
          </Button>
          <Button
            variant={filterType === "BRAILLE_TO_TEXT" ? "default" : "outline"}
            onClick={() => setFilterType("BRAILLE_TO_TEXT")}
            size="sm"
          >
            Braille → Texto
          </Button>
        </div>
      </div>

      {/* Lista de traducciones */}
      {filteredTranslations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {translations.length === 0
                ? "No tienes traducciones guardadas aún."
                : "No se encontraron traducciones con los filtros aplicados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTranslations.map((translation) => (
            <Card key={translation._id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant={translation.translationType === "TEXT_TO_BRAILLE" ? "default" : "secondary"}>
                      {translation.translationType === "TEXT_TO_BRAILLE" ? "Texto → Braille" : "Braille → Texto"}
                    </Badge>
                    <span className="text-sm text-gray-500">{formatDate(translation.createdAt)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTranslation(translation._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      {translation.translationType === "TEXT_TO_BRAILLE" ? "Texto original" : "Braille original"}
                    </h4>
                    <p className="text-sm bg-gray-50 p-3 rounded border font-mono">{translation.originalText}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      {translation.translationType === "TEXT_TO_BRAILLE" ? "Traducción Braille" : "Traducción texto"}
                    </h4>
                    <p className="text-sm bg-gray-50 p-3 rounded border font-mono">{translation.brailleText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
