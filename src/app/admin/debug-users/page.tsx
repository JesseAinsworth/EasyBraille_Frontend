"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Users, Database, Key, Plus, TestTube } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  hasPassword: boolean
}

export default function DebugUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [testEmail, setTestEmail] = useState("")
  const [testPassword, setTestPassword] = useState("")
  const [isTestingPassword, setIsTestingPassword] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const { toast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

  // Obtener lista de usuarios y estadísticas
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debug/users`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setStats(data.stats)
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudieron cargar los usuarios: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Probar contraseña
  const testPasswordFunc = async () => {
    if (!testEmail || !testPassword) {
      toast({
        title: "Error",
        description: "Ingresa email y contraseña para probar",
        variant: "destructive",
      })
      return
    }

    setIsTestingPassword(true)
    try {
      const response = await fetch(`/api/debug/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-password",
          email: testEmail,
          password: testPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: data.passwordValid ? "✅ Contraseña correcta" : "❌ Contraseña incorrecta",
          description: data.passwordValid
            ? `Usuario: ${data.user.name} (${data.user.role})`
            : "La contraseña no coincide con este usuario",
          variant: data.passwordValid ? "default" : "destructive",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al probar contraseña: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsTestingPassword(false)
    }
  }

  // Crear usuario de prueba
  const createTestUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Error",
        description: "Ingresa email y contraseña para el nuevo usuario",
        variant: "destructive",
      })
      return
    }

    setIsCreatingUser(true)
    try {
      const response = await fetch(`/api/debug/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-test-user",
          email: newUserEmail,
          password: newUserPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Usuario creado",
          description: data.message,
        })
        setNewUserEmail("")
        setNewUserPassword("")
        fetchUsers()
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear usuario: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="container py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Debug de Usuarios de Base de Datos
          </CardTitle>
          <CardDescription>
            Herramientas para diagnosticar y corregir problemas con usuarios de la base de datos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["total", "admins", "users", "active"].map((key) => (
              <Card key={key}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{stats[key] || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    {key === "total"
                      ? "Total"
                      : key === "admins"
                      ? "Admins"
                      : key === "users"
                      ? "Usuarios"
                      : "Activos"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lista de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usuarios en la base de datos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando usuarios...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay usuarios en la base de datos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Probar contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Probar contraseña
              </CardTitle>
              <CardDescription>Verifica si una contraseña coincide con un usuario específico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testEmail">Email del usuario</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="testPassword">Contraseña a probar</Label>
                  <Input
                    id="testPassword"
                    type="password"
                    placeholder="contraseña"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={testPasswordFunc} disabled={isTestingPassword}>
                <Key className="mr-2 h-4 w-4" />
                {isTestingPassword ? "Probando..." : "Probar contraseña"}
              </Button>
            </CardContent>
          </Card>

          {/* Crear usuario de prueba */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear usuario de prueba
              </CardTitle>
              <CardDescription>Crea un nuevo usuario con contraseña hasheada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@midominio.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si contiene “admin”, será administrador
                  </p>
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    placeholder="contraseña123"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={createTestUser} disabled={isCreatingUser}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingUser ? "Creando..." : "Crear usuario"}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
