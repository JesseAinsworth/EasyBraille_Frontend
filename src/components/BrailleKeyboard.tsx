"use client"

import { useState, useEffect, useRef } from "react"
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
}

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
}: BrailleKeyboardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [detectedKeys, setDetectedKeys] = useState<string[]>([])
  const [deviceId, setDeviceId] = useState<string>("")
  const { toast } = useToast()

  const [lastPressTime, setLastPressTime] = useState(0)
  const DEBOUNCE_TIME = 120

  const [textBuffer, setTextBuffer] = useState<string>("")
  const textBufferRef = useRef(textBuffer)
  textBufferRef.current = textBuffer

  const [port, setPort] = useState<any>(null)
  const readerRef = useRef<any>(null)
  const keepReadingRef = useRef<boolean>(false)

  // ------------------------------------------
  // 🔑 Cargar Device ID del teclado físico
  // ------------------------------------------
  useEffect(() => {
    let stored = localStorage.getItem("brailleKeyboardDeviceId")
    if (!stored) {
      stored = `keyboard_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`
      localStorage.setItem("brailleKeyboardDeviceId", stored)
    }
    setDeviceId(stored)
  }, [])

  // ------------------------------------------
  // 🔄 Intento de reconexión automática
  // ------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const authorized = localStorage.getItem("serialAuthorized")
    if (authorized === "yes") {
      connectSerial(true)
    }
  }, [])


  // ------------------------------------------
  // 📌 Registro de acciones en backend
  // ------------------------------------------
  const logKeyboardAction = async (
    character: string,
    actionType: "char" | "space" | "backspace" | "voice"
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
      console.error("Error al registrar acción:", error)
    }
  }

  // ------------------------------------------
  // 🔊 Función de voz
  // ------------------------------------------
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Voz no soportada",
        description: "Tu navegador no soporta lectura por voz.",
        variant: "destructive",
      })
      return
    }

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "es-MX"
    utter.rate = 1
    utter.pitch = 1

    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  // ------------------------------------------
  // 🔌 Conexión Web Serial
  // ------------------------------------------
  const connectSerial = async (auto = false) => {
    try {
      if (!("serial" in navigator)) {
        toast({
          title: "Web Serial no soportado",
          description: "Tu navegador no soporta Web Serial.",
          variant: "destructive",
        })
        return
      }

      let requestedPort = null

      if (auto) {
        const ports = await (navigator as any).serial.getPorts()
        if (ports.length > 0) requestedPort = ports[0]
        else return
      }

      if (!requestedPort) {
        requestedPort = await (navigator as any).serial.requestPort()
      }

      await requestedPort.open({ baudRate: 9600 })
      setPort(requestedPort)
      setIsConnected(true)

      toast({
        title: auto ? "Arduino reconectado" : "Arduino conectado",
      })

      startReading(requestedPort)
      localStorage.setItem("serialAuthorized", "yes")
    } catch (err) {
      console.error("Error al conectar:", err)
    }
  }

  // ------------------------------------------
  // 🔌 Desconectar
  // ------------------------------------------
  const disconnectSerial = async () => {
    try {
      keepReadingRef.current = false

      if (readerRef.current) {
        try {
          await readerRef.current.cancel()
        } catch {}
        readerRef.current = null
      }

      if (port) {
        await port.close()
        setPort(null)
      }

      setIsConnected(false)
      toast({ title: "Puerto serial desconectado" })
    } catch (err) {
      console.error("Error al desconectar Serial:", err)
    }
  }

  // ------------------------------------------
  // 📥 Lectura Serial optimizada
  // ------------------------------------------
  const startReading = async (thePort: any) => {
    keepReadingRef.current = true
    const reader = thePort.readable.getReader()
    readerRef.current = reader

    let buffer = ""

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue

        const text = new TextDecoder().decode(value)
        buffer += text

        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ""

        for (let line of lines) {
          const clean = line.replace(/\0/g, "").trim()
          if (!clean) continue

          if (clean.toUpperCase() === "LEER") {
            const toRead = textBufferRef.current.trim()
            speak(toRead || "No hay texto para leer")
            logKeyboardAction("LEER", "voice")
          }
        }
      }
    } catch (err) {
      console.error("Error leyendo Serial:", err)
    } finally {
      try {
        reader.releaseLock()
      } catch {}
    }
  }

  // ------------------------------------------
  // ⌨ Captura del teclado físico
  // ------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return

      const now = Date.now()
      if (now - lastPressTime < DEBOUNCE_TIME) return
      setLastPressTime(now)

      if (event.key.length === 1) {
        const key = event.key
        setLastKey(key)
        setDetectedKeys((prev) => [...prev, key].slice(-10))
        setTextBuffer((p) => p + key)
        onTextInput(key)
        logKeyboardAction(key, "char")
      } else if (event.key === "Backspace") {
        setLastKey("⌫")
        setTextBuffer((p) => p.slice(0, -1))
        onBackspace?.()
        logKeyboardAction("backspace", "backspace")
      } else if (event.key === " ") {
        setLastKey("␣")
        setTextBuffer((p) => p + " ")
        onSpace?.()
        logKeyboardAction(" ", "space")
      } else if (event.key === "Enter") {
        const text = textBufferRef.current.trim()
        speak(text || "No hay texto para leer")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onTextInput, onBackspace, onSpace, lastPressTime])

  // ------------------------------------------
  // 🧹 Cleanup al desmontar
  // ------------------------------------------
  useEffect(() => {
    return () => {
      keepReadingRef.current = false

      if (readerRef.current) {
        try {
          readerRef.current.cancel()
        } catch {}
      }

      if (port) {
        try {
          port.close()
        } catch {}
      }
    }
  }, [])

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
              Escribe con tu teclado físico o conecta tu Arduino para la lectura por voz.
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
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
                Presiona una tecla para comenzar.
              </div>
            )}
          </div>

          {detectedKeys.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Últimas teclas detectadas:</p>
              <div className="flex flex-wrap gap-2">
                {detectedKeys.map((key, i) => (
                  <Badge key={i} variant="secondary">
                    {key === " " ? "␣" : key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!isConnected && typeof window !== 'undefined' && localStorage.getItem("serialAuthorized") !== "yes" && (
              <Button variant="outline" onClick={() => connectSerial(false)}>
                Conectar Arduino (Primera vez)
              </Button>
            )}

            {isConnected && (
              <Button variant="destructive" onClick={disconnectSerial}>
                Desconectar
              </Button>
            )}

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
