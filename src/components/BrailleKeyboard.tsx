"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Keyboard, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BrailleKeyboardProps {
  onTextInput: (text: string) => void
  onVoiceButtonPress?: () => void
}

// Mapeo de teclas a códigos Braille (simplificado)
const keyToBrailleCode: Record<string, string> = {
  a: "100000",
  b: "110000",
  c: "100100",
  d: "100110",
  e: "100010",
  f: "110100",
  g: "110110",
  h: "110010",
  i: "010100",
  j: "010110",
  k: "101000",
  l: "111000",
  m: "101100",
  n: "101110",
  o: "101010",
  p: "111100",
  q: "111110",
  r: "111010",
  s: "011100",
  t: "011110",
  u: "101001",
  v: "111001",
  w: "010111",
  x: "101101",
  y: "101111",
  z: "101011",
}

export function BrailleKeyboard({ onTextInput, onVoiceButtonPress }: BrailleKeyboardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [detectedKeys, setDetectedKeys] = useState<string[]>([])
  const [deviceId, setDeviceId] = useState<string>("")
  const { toast } = useToast()

  // Generar un ID de dispositivo único al cargar el componente
  useEffect(() => {
    const storedDeviceId = localStorage.getItem("brailleKeyboardDeviceId")
    if (storedDeviceId) {
      setDeviceId(storedDeviceId)
    } else {
      const newDeviceId = `keyboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem("brailleKeyboardDeviceId", newDeviceId)
      setDeviceId(newDeviceId)
    }
  }, [])

  // Función para registrar una acción del teclado
  const logKeyboardAction = async (character: string, actionType: "char" | "space" | "backspace" | "openApp") => {
    try {
      const brailleCode = keyToBrailleCode[character] || "000000"

      const token = localStorage.getItem("token")
      if (!token) return // No registrar si no hay token

      await fetch("/api/keyboard-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brailleCode,
          character,
          actionType,
          deviceId,
        }),
      })
    } catch (error) {
      console.error("Error al registrar acción del teclado:", error)
    }
  }

  useEffect(() => {
    // Función para manejar eventos de teclado
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detectar combinación Ctrl+Shift+V para simular botón de voz
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault()
        event.stopPropagation()
        
        if (onVoiceButtonPress) {
          onVoiceButtonPress()
          setLastKey("🔊")
          toast({
            title: "Botón de voz activado",
            description: "Traduciendo y leyendo resultado...",
            duration: 2000,
          })
        }
        return
      }
      
      // Detectar solo letras individuales (sin necesidad de Ctrl+Alt)
      if (event.key.length === 1 && /[a-z]/.test(event.key)) {
        // Prevenir procesamiento múltiple
        event.preventDefault()
        event.stopPropagation()
        
        const key = event.key.toLowerCase()
        setLastKey(key)

        // Añadir la tecla a la lista de teclas detectadas
        setDetectedKeys((prev) => {
          const newKeys = [...prev, key]
          // Mantener solo las últimas 10 teclas
          if (newKeys.length > 10) {
            return newKeys.slice(newKeys.length - 10)
          }
          return newKeys
        })

        // Enviar la tecla al componente padre
        onTextInput(key)

        // Registrar la acción del teclado
        logKeyboardAction(key, "char")

        // Marcar como conectado cuando se detecta una tecla
        setIsConnected(true)
      } else if (event.key === "Backspace") {
        // Manejar la tecla de retroceso
        setLastKey("⌫")
        logKeyboardAction("backspace", "backspace")
      } else if (event.key === " ") {
        // Manejar la tecla de espacio
        setLastKey("␣")
        logKeyboardAction("space", "space")
      }
    }

    // Agregar el event listener con capture para interceptar primero
    window.addEventListener("keydown", handleKeyDown, { capture: true })

    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
    }
  }, [onTextInput, onVoiceButtonPress, deviceId, toast])

  // Simular desconexión después de 5 segundos sin actividad
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setIsConnected(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isConnected, lastKey])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Teclado Braille
            </CardTitle>
            <CardDescription>Conecta tu teclado Braille Arduino para escribir directamente</CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>{isConnected ? "Conectado" : "Desconectado"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md min-h-[60px] flex items-center justify-center">
            {lastKey ? (
              <div className="text-4xl font-mono">{lastKey}</div>
            ) : (
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Presiona una tecla en tu teclado Braille para comenzar
              </div>
            )}
          </div>

          {detectedKeys.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Últimas teclas detectadas:</p>
              <div className="flex flex-wrap gap-2">
                {detectedKeys.map((key, index) => (
                  <Badge key={index} variant="secondary">
                    {key === " " ? "␣" : key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              Tu teclado Braille envía letras individuales que son detectadas automáticamente.
            </p>
            {onVoiceButtonPress && (
              <p className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Info className="h-4 w-4" />
                Presiona <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs font-mono">Ctrl+Shift+V</kbd> para traducir y leer el resultado.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}