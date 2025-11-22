"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Keyboard, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://easybraillebackend-production.up.railway.app"

interface BrailleKeyboardProps {
  onTextInput: (text: string) => void
  onBackspace?: () => void
  onSpace?: () => void
  onOpenPage?: () => void
  onVoice?: () => void
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

export function BrailleKeyboard({
  onTextInput,
  onBackspace,
  onSpace,
  onOpenPage,
  onVoice,
}: BrailleKeyboardProps) {
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
      const newDeviceId = `keyboard_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`
      localStorage.setItem("brailleKeyboardDeviceId", newDeviceId)
      setDeviceId(newDeviceId)
    }
  }, [])

  // Función para registrar una acción del teclado
  const logKeyboardAction = async (
    character: string,
    actionType: "char" | "space" | "backspace" | "openApp" | "voice"
  ) => {
    try {
      const brailleCode = keyToBrailleCode[character] || "000000"
      const token = localStorage.getItem("token")
      if (!token) return

      await fetch(`${API_URL}/api/keyboard-actions`, {
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.length === 1 &&
        /[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\.\,\!\?\:\;\-()'"/\+\*\/\=]/.test(event.key)
      ) {
        const key = event.key.toLowerCase()
        setLastKey(key)

        setDetectedKeys((prev) => {
          const newKeys = [...prev, key]
          return newKeys.length > 10 ? newKeys.slice(-10) : newKeys
        })

        onTextInput(key)
        logKeyboardAction(key, "char")
        setIsConnected(true)
      } else if (event.key === "Backspace") {
        setLastKey("⌫")
        if (onBackspace) {
          onBackspace()
        } else {
          onTextInput("\b")
        }
        logKeyboardAction("backspace", "backspace")
        setIsConnected(true)
      } else if (event.key === " ") {
        setLastKey("␣")
        if (onSpace) {
          onSpace()
        } else {
          onTextInput(" ")
        }
        logKeyboardAction(" ", "space")
        setIsConnected(true)
      } else if (event.key === "Enter") {
        setLastKey("⏎")
        if (onVoice) onVoice()
        logKeyboardAction("enter", "voice")
        setIsConnected(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onTextInput, onBackspace, onSpace, onOpenPage, onVoice, deviceId])

  // Simular desconexión después de 5 segundos sin actividad
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setIsConnected(false), 5000)
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
            <CardDescription>
              Conecta tu teclado Braille Arduino para escribir directamente
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Última tecla detectada */}
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

          {/* Últimas teclas */}
          {detectedKeys.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Últimas teclas detectadas:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedKeys.map((key, index) => (
                  <Badge key={index} variant="secondary">
                    {key === " " ? "␣" : key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Texto informativo */}
          <div className="text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              Tu teclado Braille envía letras individuales que son detectadas automáticamente.
            </p>
          </div>

          {/* ✅ Botón de redirección */}
          <div className="pt-4">
            <Button
              variant="default"
              onClick={() => (window.location.href = "https://www.easy-braille.com/")}
            >
              Ir a EasyBraille.com
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
