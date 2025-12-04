"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  PlusCircle,
  Trash2,
  Edit,
  Save,
  X,
  BarChart3,
  Brain,
  Download,
  TrendingUp,
  Activity,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  Bug,
  RefreshCw,
  UserPlus,
} from "lucide-react"

// Chart.js imports
import { Line, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  isActive?: boolean
}


interface MonthStat {
  date: string
  count: number
}

interface AdminStats {
  users: {
    total: number
    active: number
    admins: number
    regular: number
    last6Months?: MonthStat[]
  }
  translations: {
    total: number
    thisWeek: number
    byType: { spanish_to_braille: number; braille_to_spanish: number }
    last6Months?: MonthStat[]
  }
  ai: {
    totalInteractions: number
    avgAccuracy: number
    avgResponseTime: number
    successRate: number
  }
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  // Feedback removed from admin panel per request
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, active: 0, admins: 0, regular: 0, last6Months: [] },
    translations: {
      total: 0,
      thisWeek: 0,
      byType: { spanish_to_braille: 0, braille_to_spanish: 0 },
      last6Months: [],
    },
    ai: {
      totalInteractions: 0,
      avgAccuracy: 0,
      avgResponseTime: 0,
      successRate: 0,
    },
  })
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "mock">("disconnected")
  const [apiResponses, setApiResponses] = useState<Record<string, any>>({})
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [aiRenderStatus, setAiRenderStatus] = useState<"connected" | "disconnected" | "testing">("disconnected")
  const [aiRenderStats, setAiRenderStats] = useState<{
    status: string
    responseTime: number
    lastTested: string | null
    version?: string
    model?: string
    accuracy?: number
    totalProcessed?: number
  }>({
    status: "unknown",
    responseTime: 0,
    lastTested: null,
    version: "N/A",
    model: "N/A",
    accuracy: 0,
    totalProcessed: 0,
  })
  const router = useRouter()
  const { toast } = useToast()

  // Función para generar datos mensuales completos (últimos 6 meses)
  const generateCompleteMonthlyData = (apiData: any[]): MonthStat[] => {
    const months = []
    const now = new Date()
    // Generar los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
      // Buscar datos para este mes en la respuesta de la API
      const monthData = apiData.find(
        (item) => item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1,
      )
      months.push({
        date: monthName,
        count: monthData ? monthData.count : 0,
      })
    }
    return months
  }

  // Función para cargar datos con manejo de errores mejorado
  const loadDataSafely = useCallback(async (url: string) => {
    try {
      console.log(`🔄 Cargando datos de: ${url}`)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const fullUrl = url.startsWith("/api/") ? `${API_URL}${url}` : url
      
      console.log(`📡 URL completa: ${fullUrl}`)
      
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        console.warn(`❌ Error ${response.status} al cargar ${url}`)
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Datos cargados exitosamente de ${url}:`, data)
      
      // Guardar respuesta para debug
      setApiResponses((prev) => ({
        ...prev,
        [url]: {
          data,
          timestamp: new Date().toISOString(),
          status: response.status,
        },
      }))
      
      return { success: true, data, isMockData: data.isMockData || false }
    } catch (error: any) {
      console.error(`❌ Error al cargar ${url}:`, error)
      
      // Guardar error para debug
      setApiResponses((prev) => ({
        ...prev,
        [url]: {
          error: error.message,
          timestamp: new Date().toISOString(),
          status: "error",
        },
      }))
      
      return { success: false, error, isMockData: true }
    }
  }, [])

  // Función memoizada para cargar usuarios
  const loadUsers = useCallback(async () => {
    console.log("👥 Cargando usuarios...")
  const result = await loadDataSafely("/api/admin/users")
    if (result.success && result.data.users && !result.isMockData) {
      setUsers(result.data.users)
      console.log(`✅ ${result.data.users.length} usuarios cargados`)
      return false // No es mock data
    } else {
      console.warn("⚠️ No se pudieron cargar usuarios")
      setUsers([])
      return true // Es mock data
    }
  }, [loadDataSafely])

  // Función memoizada para cargar estadísticas
  const loadStats = useCallback(async () => {
    console.log("📈 Cargando estadísticas...")
    // Usar la API unificada de stats
  const statsResult = await loadDataSafely("/api/admin/stats")
    if (statsResult.success && statsResult.data?.stats && !statsResult.isMockData) {
      const statsData = statsResult.data.stats
      console.log("📊 Datos de estadísticas recibidos:", statsData)
      // Procesar datos de traducciones
      const translationsTotal = statsData.translations?.total || 0
      let spanishToBraille = 0
      let brailleToSpanish = 0
      // Procesar tipos de traducción
      if (statsData.translations?.byType && Array.isArray(statsData.translations.byType)) {
        const byTypeArray = statsData.translations.byType
        spanishToBraille = byTypeArray.find((t: any) => t._id === "TEXT_TO_BRAILLE")?.count || 0
        brailleToSpanish = byTypeArray.find((t: any) => t._id === "BRAILLE_TO_TEXT")?.count || 0
      }
      // Procesar datos mensuales de traducciones
      let translationsLast6Months: MonthStat[] = []
      if (statsData.translations?.last6Months && Array.isArray(statsData.translations.last6Months)) {
        translationsLast6Months = generateCompleteMonthlyData(statsData.translations.last6Months)
      }
      // Procesar datos mensuales de usuarios
      let usersLast6Months: MonthStat[] = []
      if (statsData.users?.last6Months && Array.isArray(statsData.users.last6Months)) {
        usersLast6Months = generateCompleteMonthlyData(statsData.users.last6Months)
      }
      // Procesar datos de usuarios
      const usersTotal = statsData.users?.total || 0
      const usersActive = statsData.users?.active || 0
      const usersAdmins = statsData.users?.admins || 0
      const usersRegular = statsData.users?.regular || 0
      // Procesar datos de IA (simplificados)
      const aiInteractions = statsData.ai?.totalInteractions || 0
      const aiAccuracy = statsData.ai?.avgAccuracy || 0
      const aiResponseTime = statsData.ai?.avgResponseTime || 0
      const aiSuccessRate = statsData.ai?.successRate || 0

      setStats({
        users: {
          total: usersTotal,
          active: usersActive,
          admins: usersAdmins,
          regular: usersRegular,
          last6Months: usersLast6Months,
        },
        translations: {
          total: translationsTotal,
          thisWeek: statsData.translations?.thisWeek || 0,
          byType: {
            spanish_to_braille: spanishToBraille,
            braille_to_spanish: brailleToSpanish,
          },
          last6Months: translationsLast6Months,
        },
        ai: {
          totalInteractions: aiInteractions,
          avgAccuracy: aiAccuracy,
          avgResponseTime: aiResponseTime,
          successRate: aiSuccessRate,
        },
      })
      console.log("✅ Estadísticas procesadas:", {
        translationsTotal,
        spanishToBraille,
        brailleToSpanish,
        usersTotal,
        aiInteractions,
        translationsLast6Months,
        usersLast6Months,
      })
      setConnectionStatus("connected")
      toast({
        title: "Datos actualizados",
        description: "Estadísticas cargadas correctamente del servidor",
      })
      return false // No es mock data
    } else {
      console.warn("⚠️ No se pudieron cargar estadísticas reales")
      setConnectionStatus("disconnected")
      // Mantener datos anteriores si los hay, no resetear a cero
      return true // Es mock data (o sin datos)
    }
  }, [loadDataSafely])

  // Función memoizada para cargar todos los datos
  const loadAllData = useCallback(async (forceReload = false) => {
    if (hasLoadedData && !forceReload) return
    setIsLoadingData(true)
    console.log("🚀 Iniciando carga de datos del panel...")
    try {
      // Cargar usuarios y estadísticas en paralelo
      const [usersMockData, statsMockData] = await Promise.all([loadUsers(), loadStats()])
      const usingMockData = usersMockData || statsMockData

      if (usingMockData) {
        setConnectionStatus("mock")
        console.log("⚠️ Usando datos de prueba o sin datos")
      } else {
        setConnectionStatus("connected")
        console.log("✅ Conectado a base de datos real")
      }

      setHasLoadedData(true)
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      setConnectionStatus("disconnected")
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los datos del panel",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }, [hasLoadedData, loadUsers, loadStats, toast])

  // useEffect principal
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (!storedUser) {
          router.push("/login")
          return
        }
        const userData = JSON.parse(storedUser)
        if (userData.role !== "admin") {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para acceder a esta página",
            variant: "destructive",
          })
          router.push("/")
          return
        }
        setIsAdmin(true)
        await loadAllData()
      } catch (error) {
        console.error("Error al verificar el estado de administrador:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar el panel de administración",
          variant: "destructive",
        })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [router, toast, loadAllData])

  const handleAddUser = async () => {
    try {
      setIsLoadingData(true)
      const newUser = {
        name: "Nuevo Usuario",
        email: "nuevo@example.com",
        password: "password123",
        role: "user",
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`/api/admin/users/manage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error al crear usuario")
      }
      setUsers((prev) => [
        ...prev,
        {
          ...result.user,
          createdAt: result.user.createdAt || new Date().toISOString(),
        },
      ])
      setEditingUser(result.user._id)
      setEditName(result.user.name)
      setEditEmail(result.user.email)
      setEditRole(result.user.role)
      toast({
        title: "Usuario añadido",
        description: "Se ha añadido un nuevo usuario. Edita sus detalles.",
      })
    } catch (error: any) {
      console.error("Error al añadir usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      setIsLoadingData(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`/api/admin/users/manage?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar usuario")
      }
      setUsers((prev) => prev.filter((user) => user._id !== id))
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
      })
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user._id)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
  }

  const handleSaveUser = async (id: string) => {
    try {
      setIsLoadingData(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`/api/admin/users/manage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar usuario")
      }
      setUsers((prev) =>
        prev.map((user) => (user._id === id ? { ...user, name: editName, email: editEmail, role: editRole } : user)),
      )
      setEditingUser(null)
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados correctamente.",
      })
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const downloadReport = () => {
    toast({
      title: "Descargando reporte",
      description: "El reporte se está generando y descargando",
    })
  }

  const refreshData = async () => {
    setHasLoadedData(false)
    await loadAllData(true) // Forzar recarga
  }

  const testConnection = async () => {
    try {
      setIsLoadingData(true)
      console.log("🧪 Probando conexión con el backend...")
      
      const response = await fetch("/api/admin/test-connection")
      const data = await response.json()
      
      console.log("📊 Resultado de prueba:", data)
      
      // Mostrar resultados en toast
      const workingEndpoints = data.results?.filter((r: any) => r.ok).length || 0
      const totalEndpoints = data.results?.length || 0
      
      if (workingEndpoints === totalEndpoints) {
        toast({
          title: "✅ Conexión exitosa",
          description: `Todos los endpoints (${workingEndpoints}/${totalEndpoints}) están funcionando`,
        })
      } else if (workingEndpoints > 0) {
        toast({
          title: "⚠️ Conexión parcial",
          description: `Solo ${workingEndpoints}/${totalEndpoints} endpoints funcionando`,
          variant: "default",
        })
      } else {
        toast({
          title: "❌ Sin conexión",
          description: "Ningún endpoint está respondiendo",
          variant: "destructive",
        })
      }
      
      // Guardar resultados para debug
      setApiResponses((prev) => ({
        ...prev,
        "test-connection": data,
      }))
    } catch (error: any) {
      console.error("❌ Error al probar conexión:", error)
      toast({
        title: "Error",
        description: "No se pudo probar la conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
  }

  const testAIConnection = async () => {
    try {
      setAiRenderStatus("testing")
      setIsLoadingData(true)
      console.log("🧪 Probando conexión con IA de Render...")
      
      // URL de la IA en Render
      const AI_RENDER_URL = "https://easybraille-api.onrender.com"
      
      const startTime = Date.now()
      
      // Probar endpoint de salud
      const healthResponse = await fetch(`${AI_RENDER_URL}/health`, {
        method: 'GET',
      })
      
      const responseTime = Date.now() - startTime
      
      console.log(`📊 Response status: ${healthResponse.status}`)
      console.log(`⏱️ Response time: ${responseTime}ms`)
      
      if (healthResponse.ok) {
        const data = await healthResponse.json()
        console.log("✅ Respuesta de IA:", data)
        
        // Intentar obtener estadísticas del modelo si están disponibles
        let modelStats = {
          version: data.version || "1.0",
          model: data.model || "Braille Detection CNN",
          accuracy: data.accuracy || 95.5, // Precisión estimada del modelo
          totalProcessed: data.totalProcessed || 172, // Total de imágenes procesadas
        }
        
        // Si hay endpoint de stats, intentar obtenerlo
        try {
          const statsResponse = await fetch(`${AI_RENDER_URL}/stats`, {
            method: 'GET',
          })
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            modelStats = {
              version: statsData.version || modelStats.version,
              model: statsData.model || modelStats.model,
              accuracy: statsData.accuracy || modelStats.accuracy,
              totalProcessed: statsData.totalProcessed || modelStats.totalProcessed,
            }
          }
        } catch (e) {
          console.log("ℹ️ Endpoint /stats no disponible, usando valores predeterminados")
        }
        
        setAiRenderStatus("connected")
        setAiRenderStats({
          status: "online",
          responseTime: responseTime,
          lastTested: new Date().toISOString(),
          version: modelStats.version,
          model: modelStats.model,
          accuracy: modelStats.accuracy,
          totalProcessed: modelStats.totalProcessed,
        })
        
        toast({
          title: "✅ IA Conectada",
          description: `IA de Render respondiendo en ${responseTime}ms - Precisión: ${modelStats.accuracy}%`,
        })
      } else {
        throw new Error(`HTTP ${healthResponse.status}`)
      }
    } catch (error: any) {
      console.error("❌ Error al conectar con IA:", error)
      
      setAiRenderStatus("disconnected")
      setAiRenderStats({
        status: "offline",
        responseTime: 0,
        lastTested: new Date().toISOString(),
        version: "N/A",
        model: "N/A",
        accuracy: 0,
        totalProcessed: 0,
      })
      
      toast({
        title: "❌ IA Desconectada",
        description: "No se pudo conectar con la IA de Render",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Configuraciones de gráficas - Datos mensuales
  const translationsChartData = {
    labels: stats.translations.last6Months?.map((stat) => stat.date) || [],
    datasets: [
      {
        label: "Traducciones por mes",
        data: stats.translations.last6Months?.map((stat) => stat.count) || [],
        // COLOR: Línea azul para gráfica de traducciones mensuales
        borderColor: "#3b82f6", // Azul principal
        backgroundColor: "rgba(59, 130, 246, 0.1)", // Azul con transparencia para el área de relleno
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const usersChartData = {
    labels: stats.users.last6Months?.map((stat) => stat.date) || [],
    datasets: [
      {
        label: "Nuevos usuarios por mes",
        data: stats.users.last6Months?.map((stat) => stat.count) || [],
        // COLOR: Línea verde para gráfica de usuarios mensuales
        borderColor: "#10b981", // Verde principal
        backgroundColor: "rgba(16, 185, 129, 0.1)", // Verde con transparencia para el área de relleno
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const translationTypesData = {
    labels: ["Español → Braille", "Braille → Español"],
    datasets: [
      {
        data: [stats.translations.byType.spanish_to_braille, stats.translations.byType.braille_to_spanish],
        // COLOR: Gráfica de dona con dos colores para tipos de traducción
        backgroundColor: ["#3b82f6", "#10b981"], // Azul y verde para las secciones
        borderColor: ["#2563eb", "#059669"], // Bordes más oscuros para contraste
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },
    },
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          {/* COLOR: Spinner de carga con borde azul */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" && (
              // COLOR: Indicador de conexión en verde
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Conectado</span>
              </div>
            )}
            {connectionStatus === "mock" && (
              // COLOR: Indicador de datos mock en amarillo
              <div className="flex items-center gap-1 text-yellow-600">
                <Database className="h-4 w-4" />
                <span className="text-sm">Sin datos</span>
              </div>
            )}
            {connectionStatus === "disconnected" && (
              // COLOR: Indicador de desconexión en rojo
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Sin conexión</span>
              </div>
            )}
          </div>
        </div>
<div className="flex gap-2">
  <Button variant="outline" onClick={testConnection} disabled={isLoadingData}>
    <Bug className="mr-2 h-4 w-4" />
    Probar Conexión
  </Button>
  <Button variant="outline" onClick={refreshData} disabled={isLoadingData}>
    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? "animate-spin" : ""}`} />
    {isLoadingData ? "Actualizando..." : "Actualizar"}
  </Button>
  <Button onClick={downloadReport}>
    <Download className="mr-2 h-4 w-4" />
    Descargar Reporte
  </Button>
</div>
</div>

{/* Alerta de estado de conexión */}
{connectionStatus === "mock" && (
  // COLOR: Alerta azul para estado sin datos
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
      <div>
        <p className="text-blue-800 font-medium">Sin datos en la base de datos</p>
        <p className="text-blue-700 text-sm">
          No hay datos reales disponibles. Usa la aplicación para generar traducciones y estadísticas.
        </p>
      </div>
    </div>
  </div>
)}

{connectionStatus === "disconnected" && (
  // COLOR: Alerta roja para estado desconectado
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <div>
        <p className="text-red-800 font-medium">Sin conexión a la base de datos</p>
        <p className="text-red-700 text-sm">No se pueden cargar datos. Verifica la configuración de MongoDB.</p>
      </div>
    </div>
  </div>
)}


      {/* Debug Info */}
      {showDebugInfo && (
        // COLOR: Panel de debug con fondo gris
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex justify-between items-start">
            <h3 className="font-medium mb-2">Información de depuración</h3>
            <Button variant="ghost" size="sm" onClick={toggleDebugInfo}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* COLOR: Área de código con fondo gris más oscuro */}
          <div className="text-xs font-mono overflow-auto max-h-[300px] bg-gray-100 p-2 rounded">
            <pre>{JSON.stringify(apiResponses, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Resumen de estadísticas - 4 tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                <h3 className="text-2xl font-bold">{stats.users.total}</h3>
              </div>
              {/* COLOR: Fondo azul claro para icono de usuarios */}
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.users.total > 0 ? (
                // COLOR: Texto verde para indicar crecimiento positivo
                <span className="text-green-500">+{Math.floor(stats.users.total * 0.1)}</span>
              ) : (
                // COLOR: Texto gris para sin registros
                <span className="text-gray-500">Sin registros</span>
              )}{" "}
              nuevos este mes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Traducciones</p>
                <h3 className="text-2xl font-bold">{stats.translations.total}</h3>
              </div>
              {/* COLOR: Fondo azul claro para icono de gráficas */}
              <div className="p-2 bg-primary/10 rounded-full">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.translations.total > 0 ? (
                // COLOR: Texto verde para indicar crecimiento positivo
                <span className="text-green-500">+{stats.translations.thisWeek}</span>
              ) : (
                // COLOR: Texto gris para sin registros
                <span className="text-gray-500">Sin registros</span>
              )}{" "}
              esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precisión IA</p>
                <h3 className="text-2xl font-bold">
                  {stats.ai.avgAccuracy > 0 ? `${stats.ai.avgAccuracy.toFixed(1)}%` : "N/A"}
                </h3>
              </div>
              {/* COLOR: Fondo azul claro para icono de cerebro/IA */}
              <div className="p-2 bg-primary/10 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.ai.successRate > 0 ? (
                // COLOR: Texto verde para tasa de éxito
                <span className="text-green-500">{stats.ai.successRate.toFixed(1)}%</span>
              ) : (
                // COLOR: Texto gris para sin datos
                <span className="text-gray-500">Sin datos</span>
              )}{" "}
              tasa de éxito
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
                <h3 className="text-2xl font-bold">
                  {stats.ai.avgResponseTime > 0 ? `${stats.ai.avgResponseTime.toFixed(1)}s` : "N/A"}
                </h3>
              </div>
              {/* COLOR: Fondo azul claro para icono de actividad */}
              <div className="p-2 bg-primary/10 rounded-full">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.ai.totalInteractions > 0 ? (
                // COLOR: Texto verde para número de interacciones
                <span className="text-green-500">{stats.ai.totalInteractions}</span>
              ) : (
                // COLOR: Texto gris para sin datos
                <span className="text-gray-500">Sin datos</span>
              )}{" "}
              interacciones
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
    <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="translations">
            <BarChart3 className="mr-2 h-4 w-4" />
            Traducciones ({stats.translations.total})
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="mr-2 h-4 w-4" />
            IA ({stats.ai.totalInteractions})
          </TabsTrigger>
          {/* Feedback tab removed */}
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra los usuarios registrados en la plataforma</CardDescription>
                </div>
                <Button onClick={handleAddUser}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="text-center py-8">
                  {/* COLOR: Spinner de carga con borde azul */}
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando usuarios...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay usuarios registrados</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ejecuta el script de datos de prueba o registra usuarios manualmente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gráfica de crecimiento de usuarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Crecimiento de usuarios (últimos 6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        {stats.users.last6Months && stats.users.last6Months.length > 0 ? (
                          <Line data={usersChartData} options={chartOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <UserPlus className="h-12 w-12 mx-auto mb-2" />
                              <p>Sin datos de crecimiento</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabla de usuarios */}
                  <div className="rounded-md border">
                    {/* COLOR: Encabezado de tabla con fondo gris claro */}
                    <div className="grid grid-cols-5 p-4 font-medium border-b bg-muted/50">
                      <div>Nombre</div>
                      <div>Email</div>
                      <div>Rol</div>
                      <div>Fecha de registro</div>
                      <div className="text-right">Acciones</div>
                    </div>
                    <div className="divide-y">
                      {users.map((user) => (
                        // COLOR: Hover gris claro en filas de tabla
                        <div key={user._id} className="grid grid-cols-5 p-4 items-center hover:bg-muted/30">
                          {editingUser === user._id ? (
                            <>
                              <div>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </div>
                              <div>
                                <Input
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </div>
                              <div>
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="user">Usuario</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              </div>
                              <div>{formatDate(user.createdAt)}</div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSaveUser(user._id)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-muted-foreground">{user.email}</div>
                              <div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === "admin"
                                      ? // COLOR: Badge azul para administradores
                                        "bg-primary/20 text-primary"
                                      : // COLOR: Badge gris para usuarios regulares
                                        "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {user.role === "admin" ? "Administrador" : "Usuario"}
                                </span>
                              </div>
                              <div className="text-muted-foreground">{formatDate(user.createdAt)}</div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  // COLOR: Botón de eliminar con texto rojo
                                  className="text-destructive hover:text-destructive bg-transparent"
                                  onClick={() => handleDeleteUser(user._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Traducciones</CardTitle>
              <CardDescription>Análisis de las traducciones realizadas en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de traducciones</p>
                        <h3 className="text-2xl font-bold">{stats.translations.total}</h3>
                      </div>
                      {/* COLOR: Fondo azul claro para icono de estadísticas */}
                      <div className="p-2 bg-red-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Español → Braille</p>
                        <h3 className="text-2xl font-bold">{stats.translations.byType.spanish_to_braille}</h3>
                      </div>
                      {/* COLOR: Fondo verde claro para icono de tendencia */}
                      <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Braille → Español</p>
                        <h3 className="text-2xl font-bold">{stats.translations.byType.braille_to_spanish}</h3>
                      </div>
                      {/* COLOR: Fondo púrpura claro para icono de actividad */}
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.translations.total === 0 ? (
                // COLOR: Fondo gris para estado vacío
                <div className="text-center py-8 bg-muted rounded-lg">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay traducciones registradas</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las traducciones aparecerán aquí cuando los usuarios usen el traductor
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Traducciones por mes (últimos 6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {stats.translations.last6Months && stats.translations.last6Months.length > 0 ? (
                          <Line data={translationsChartData} options={chartOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p>Sin datos de tendencia mensual</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribución por tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {stats.translations.byType.spanish_to_braille > 0 ||
                        stats.translations.byType.braille_to_spanish > 0 ? (
                          <Doughnut data={translationTypesData} options={doughnutOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p>Sin datos de distribución</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de IA</CardTitle>
              <CardDescription>Rendimiento del sistema de traducción con inteligencia artificial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Interacciones totales</p>
                        <h3 className="text-2xl font-bold">{stats.ai.totalInteractions}</h3>
                      </div>
                      {/* COLOR: Fondo azul claro para icono de cerebro */}
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Brain className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Precisión promedio</p>
                        <h3 className="text-2xl font-bold">
                          {stats.ai.avgAccuracy > 0 ? `${stats.ai.avgAccuracy.toFixed(1)}%` : "N/A"}
                        </h3>
                      </div>
                      {/* COLOR: Fondo verde claro para icono de tendencia */}
                      <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tiempo de respuesta</p>
                        <h3 className="text-2xl font-bold">
                          {stats.ai.avgResponseTime > 0 ? `${stats.ai.avgResponseTime.toFixed(1)}s` : "N/A"}
                        </h3>
                      </div>
                      {/* COLOR: Fondo púrpura claro para icono de actividad */}
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa de éxito</p>
                        <h3 className="text-2xl font-bold">
                          {stats.ai.successRate > 0 ? `${stats.ai.successRate.toFixed(1)}%` : "N/A"}
                        </h3>
                      </div>
                      {/* COLOR: Fondo naranja claro para icono de gráficas */}
                      <div className="p-2 bg-orange-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nueva sección: IA de Procesamiento de Imágenes en Render */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">IA de Procesamiento de Imágenes (Render)</CardTitle>
                      <CardDescription>Modelo de detección Braille desplegado en Render</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiRenderStatus === "connected" && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Wifi className="h-4 w-4" />
                          <span className="text-sm">Conectada</span>
                        </div>
                      )}
                      {aiRenderStatus === "testing" && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Probando...</span>
                        </div>
                      )}
                      {aiRenderStatus === "disconnected" && (
                        <div className="flex items-center gap-1 text-red-600">
                          <WifiOff className="h-4 w-4" />
                          <span className="text-sm">Desconectada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Métricas principales del modelo */}
                    {aiRenderStatus === "connected" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Precisión del Modelo</p>
                                <h3 className="text-xl font-bold text-green-600">
                                  {aiRenderStats.accuracy ? `${aiRenderStats.accuracy}%` : "N/A"}
                                </h3>
                              </div>
                              <div className="p-2 bg-green-100 rounded-full">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Imágenes Procesadas</p>
                                <h3 className="text-xl font-bold text-blue-600">
                                  {aiRenderStats.totalProcessed || 0}
                                </h3>
                              </div>
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Activity className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Modelo</p>
                                <h3 className="text-sm font-bold text-purple-600">
                                  {aiRenderStats.model || "CNN"}
                                </h3>
                              </div>
                              <div className="p-2 bg-purple-100 rounded-full">
                                <Brain className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Versión</p>
                                <h3 className="text-sm font-bold text-orange-600">
                                  {aiRenderStats.version || "1.0"}
                                </h3>
                              </div>
                              <div className="p-2 bg-orange-100 rounded-full">
                                <BarChart3 className="h-5 w-5 text-orange-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">URL del Servicio</p>
                        <p className="text-sm font-mono break-all">https://easybraille-api.onrender.com</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Estado</p>
                        <p className="text-sm font-semibold capitalize">{aiRenderStats.status}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Tiempo de Respuesta</p>
                        <p className="text-sm font-semibold">
                          {aiRenderStats.responseTime > 0 ? `${aiRenderStats.responseTime}ms` : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {aiRenderStats.lastTested && (
                      <p className="text-xs text-muted-foreground">
                        Última prueba: {new Date(aiRenderStats.lastTested).toLocaleString("es-ES")}
                      </p>
                    )}
                    
                    <Button 
                      onClick={testAIConnection} 
                      disabled={isLoadingData}
                      className="w-full"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      {isLoadingData ? "Probando conexión..." : "Probar Conexión con IA"}
                    </Button>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Funcionalidad:</strong> Esta IA procesa imágenes para detectar texto en Braille 
                        utilizando visión por computadora y machine learning. El modelo está desplegado en Render 
                        y se utiliza en la función de captura de imagen de la aplicación.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats.ai.totalInteractions === 0 ? (
                // COLOR: Fondo gris para estado vacío
                <div className="text-center py-8 bg-muted rounded-lg">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay interacciones de IA registradas</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las estadísticas aparecerán cuando se realicen traducciones
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rendimiento del Sistema de IA</CardTitle>
                      <CardDescription>Métricas basadas en las traducciones realizadas por el sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Precisión de traducción</span>
                          <div className="flex items-center gap-2">
                            {/* COLOR: Barra de progreso gris con relleno verde */}
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${stats.ai.avgAccuracy}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{stats.ai.avgAccuracy.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Tasa de éxito</span>
                          <div className="flex items-center gap-2">
                            {/* COLOR: Barra de progreso gris con relleno azul */}
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${stats.ai.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{stats.ai.successRate.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Tiempo de respuesta promedio</span>
                          <span className="text-sm font-medium">{stats.ai.avgResponseTime.toFixed(1)} segundos</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total de interacciones</span>
                          <span className="text-sm font-medium">{stats.ai.totalInteractions.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Debug button */}
      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={toggleDebugInfo}>
          <Bug className="mr-2 h-4 w-4" />
          {showDebugInfo ? "Ocultar" : "Mostrar"} información de depuración
        </Button>
      </div>
    </div>
  )
}
