"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Keyboard, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BrailleKeyboardProps {
  onTextInput: (text: string) => void
}

// Mapeo de alfabeto a Braille real Unicode
const alphaToBraille: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋",
  g: "⠛", h: "⠓", i: "⠊", j: "⠚", k: "⠅", l: "⠇",
  m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗",
  s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
  y: "⠽", z: "⠵",
  " ": " ",
  "⌫": "⌫"
}

export function BrailleKeyboard({ onTextInput }: BrailleKeyboardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastSymbol, setLastSymbol] = useState<string | null>(null)
  const [recentSymbols, setRecentSymbols] = useState<string[]>([])
  const [brailleBuffer, setBrailleBuffer] = useState("")
  const [deviceId, setDeviceId] = useState("")

  const { toast } = useToast()
  const portRef = useRef<any>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const readingRef = useRef(false)

  // Generar o recuperar ID de dispositivo
  useEffect(() => {
    const stored = localStorage.getItem("brailleKeyboardDeviceId")
    if (stored) {
      setDeviceId(stored)
    } else {
      const newId = `keyboard_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      localStorage.setItem("brailleKeyboardDeviceId", newId)
      setDeviceId(newId)
    }
  }, [])

  // Conexión Web Serial API
  const connectArduino = async () => {
    if (!("serial" in navigator)) {
      toast({ title: "⚠ Tu navegador NO soporta Web Serial API" })
      return
    }

    try {
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 9600 })

      portRef.current = port
      setIsConnected(true)
      startReading(port)

      localStorage.setItem("brailleSerialAuthorized", "yes")
      toast({ title: "✅ Arduino Micro conectado" })

    } catch (error) {
      console.error(error)
      toast({ title: "❌ Error al conectar Arduino" })
    }
  }

  const disconnectArduino = async () => {
    try {
      readingRef.current = false
      await readerRef.current?.cancel()
      await portRef.current?.close()
      setIsConnected(false)
      toast({ title: "🔌 Arduino desconectado" })
    } catch {}
  }

  // Lectura Serial
  const startReading = async (port: any) => {
    if (!port.readable) return

    readingRef.current = true
    const reader = port.readable.getReader()
    readerRef.current = reader

    const decoder = new TextDecoder()

    try {
      while (readingRef.current) {
        const { value, done } = await reader.read()
        if (done) break

        const data = decoder.decode(value).trim()

        // Detecta comando de voz
        if (data.toUpperCase() === "LEER") {
          window.dispatchEvent(new Event("braille-leer"))
          continue
        }

        // Si es un solo carácter detectado
        if (data.length === 1) {
          processKey(data)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      reader.releaseLock()
      readingRef.current = false
    }
  }

  // Procesar tecla recibida
  const processKey = (char: string) => {
    if (char === "⌫") {
      setLastSymbol("⌫")
      setBrailleBuffer(prev => prev.slice(0, -1))
      onTextInput("⌫")
      addRecentUI("⌫")
      setIsConnected(true)
      return
    }

    if (char === " ") {
      setLastSymbol("␣")
      setBrailleBuffer(prev => prev + " ")
      onTextInput(" ")
      addRecentUI(" ")
      setIsConnected(true)
      return
    }

    // Convertir letra a símbolo Braille real
    const lower = char.toLowerCase()
    const braille = alphaToBraille[lower] ?? ""

    if (braille) {
      setLastSymbol(braille)
      setBrailleBuffer(prev => prev + braille)
      onTextInput(braille)
      addRecentUI(braille)
      setIsConnected(true)
    }
  }

  const addRecentUI = (symbol: string) => {
    setRecentSymbols(prev => [...prev, symbol].slice(-12))
  }

  // Botón Traducir envía Braille completo acumulado
  const sendFullBraille = () => {
    if (!brailleBuffer) {
      toast({ title: "No hay Braille por enviar" })
      return
    }
    onTextInput(brailleBuffer)
    toast({ title: "⠃⠗⠁⠊⠇⠇⠑ enviado" })
  }

  // evento leer con botones de voz Arduino
  useEffect(() => {
    const leerHandler = () => {
      toast({ title: "🔊 Leyendo Braille..." })
      speakBraille()
    }

    window.addEventListener("braille-leer", leerHandler)
    return () => window.removeEventListener("braille-leer", leerHandler)
  }, [brailleBuffer])

  // 🔊 lectura con voz usando Browser API
  const speakBraille = () => {
    if (!("speechSynthesis" in window)) return
    const msg = new SpeechSynthesisUtterance(brailleBuffer || "Vacío")
    msg.lang = "es-MX"
    speechSynthesis.cancel()
    speechSynthesis.speak(msg)
  }

  // Capturar teclado físico si no está conectado Arduino
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (isConnected || e.repeat) return

      if (e.key === "Backspace") {
        setLastSymbol("⌫")
        setBrailleBuffer(prev => prev.slice(0, -1))
        onTextInput("⌫")
        addRecentUI("⌫")
        return
      }

      if (e.key === " ") {
        setLastSymbol("␣")
        setBrailleBuffer(prev => prev + " ")
        onTextInput(" ")
        addRecentUI(" ")
        return
      }

      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        const lower = e.key.toLowerCase()
        const braille = alphaToBraille[lower]
        if (!braille) return

        setLastSymbol(braille)
        setBrailleBuffer(prev => prev + braille)
        onTextInput(braille)
        addRecentUI(braille)
      }
    }

    window.addEventListener("keydown", keyHandler)
    return () => window.removeEventListener("keydown", keyHandler)
  }, [isConnected])

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5"/> Teclado Braille Virtual
          </CardTitle>
          <Badge>{isConnected ? "🟢 Conectado" : "⚪ Desconectado"}</Badge>
        </div>
        <CardDescription>
          Escribe usando pulsadores físicos desde Arduino Micro o teclado físico
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Visual de última tecla */}
        <div className="bg-muted border p-3 rounded-md h-16 flex justify-center items-center">
          {lastSymbol ? (
            <span className="text-3xl font-mono">{ lastSymbol === " " ? "␣" : lastSymbol }</span>
          ) : (
            <span className="opacity-60 flex items-center gap-2 text-sm">
              <Info className="h-4 w-4"/> Presiona para escribir o LEER
            </span>
          )}
        </div>

        {/* Buffer Braille */}
        <textarea
          className="w-full min-h-[120px] border rounded-md p-2 font-mono text-xl"
          readOnly
          value={brailleBuffer}
          placeholder="⠁⠃⠉ ⠌⠑⠗⠊⠁⠇..."
        />

        {/* Últimos símbolos */}
        {recentSymbols.length > 0 && (
          <div>
            <p className="text-sm mb-2">Últimos símbolos:</p>
            <div className="flex flex-wrap gap-2">
              {recentSymbols.map((sym, i) => (
                <Badge key={i}>{sym === " " ? "␣" : sym}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">

          {!isConnected ? (
            <Button variant="outline" onClick={connectArduino}>
              🔌 Conectar Arduino Micro
            </Button>
          ) : (
            <Button variant="destructive" onClick={disconnectArduino}>
              ❌ Desconectar
            </Button>
          )}

          <Button onClick={sendFullBraille}>
            📡 Enviar Braille completo
          </Button>

          <Button onClick={speakBraille}>🔊 Leer</Button>

        </div>

      </CardContent>
    </Card>
  )
}

export default BrailleKeyboard
