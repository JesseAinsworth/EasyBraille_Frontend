"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Keyboard, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://easybraillebackend-production.up.railway.app"

interface BrailleKeyboardProps {
  onTextInput: (text: string) => void
  onBackspace?: () => void
  onSpace?: () => void
}

const keyToBraille: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋",
  g: "⠛", h: "⠓", i: "⠊", j: "⠚", k: "⠅", l: "⠇",
  m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗",
  s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
  y: "⠽", z: "⠵", " ": " ",
  "1": "⠼⠁","2": "⠼⠃","3": "⠼⠉","4": "⠼⠙","5": "⠼⠑",
  "6": "⠼⠋","7": "⠼⠛","8": "⠼⠓","9": "⠼⠊","0": "⠼⠚",
  "+": "⠐⠖","-": "⠤","*": "⠐⠦","/": "⠸⠌","=": "⠐⠶",
  ".": "⠲",",": "⠂","?": "⠦","!": "⠖","'": "⠄",'"': "⠐⠄"
}

export function BrailleKeyboard({ onTextInput, onBackspace, onSpace }: BrailleKeyboardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastSymbol, setLastSymbol] = useState<string | null>(null)
  const [recentSymbols, setRecentSymbols] = useState<string[]>([])
  const [deviceId, setDeviceId] = useState("")
  const [port, setPort] = useState<any>(null)

  const { toast } = useToast()
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const keepReading = useRef(false)
  const bufferRef = useRef("")
  const textRef = useRef("")
  const lastPressRef = useRef(0)
  const DEBOUNCE = 120

  // Generar ID persistente para el dispositivo
  useEffect(() => {
    const stored = localStorage.getItem("brailleDeviceId")
    if (stored) setDeviceId(stored)
    else {
      const id = `keyboard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem("brailleDeviceId", id)
      setDeviceId(id)
    }
  }, [])

  // Reconectar automáticamente si existen permisos previos
  useEffect(() => {
    if ("serial" in navigator) {
      (navigator as any).serial.getPorts().then(async (ports: any[]) => {
        if (ports.length > 0) {
          try {
            await ports[0].open({ baudRate: 9600 })
            setPort(ports[0])
            setIsConnected(true)
            readSerial(ports[0])
            toast({ title: "Arduino reconectado" })
          } catch {}
        }
      })
    }
  }, [])

  // Leer puerto Serial
  const readSerial = async (thePort: any) => {
    keepReading.current = true
    const reader = thePort.readable?.getReader()
    if (!reader) return
    readerRef.current = reader

    try {
      while (keepReading.current) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          bufferRef.current += new TextDecoder().decode(value)
          let lines = bufferRef.current.split(/\r?\n/)
          bufferRef.current = lines.pop() || ""

          for (const line of lines) handleSerialLine(line.trim())
        }
      }
    } catch (e) {
      console.error("Error Serial:", e)
    } finally {
      reader.releaseLock()
      keepReading.current = false
    }
  }

  // Procesar líneas recibidas del Arduino
  const handleSerialLine = (line: string) => {
    if (!line) return

    if (line.toUpperCase() === "LEER") {
      speak(textRef.current || "No hay texto para leer")
    }

    if (line.startsWith("Carácter detectado:")) {
      const rawChar = line.split(":")[1].trim()
      if (rawChar === "⌫" || rawChar.toUpperCase() === "BACKSPACE") {
        textRef.current = textRef.current.slice(0, -1)
        onBackspace?.()
        return
      }

      if (rawChar === " ") {
        textRef.current += " "
        onSpace?.()
        addSymbol(" ")
        return
      }

      const lower = rawChar.toLowerCase()
      textRef.current += lower
      addSymbol(lower)
      onTextInput(keyToBraille[lower] ?? lower)
    }
  }

  // Registrar símbolo para UI
  const addSymbol = (char: string) => {
    const symbol = keyToBraille[char] ?? char
    setLastSymbol(symbol)
    setRecentSymbols(prev => [...prev, symbol].slice(-12))
  }

  // Sintetizador de voz
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast({ title: "Voz no disponible", variant: "destructive" })
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "es-MX"
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  // Lectura por voz desde UI
  const speakBuffer = () => speak(textRef.current || "No hay texto para leer")

  // Registrar acciones en backend
  const logAction = async (char: string, type: "char"|"space"|"backspace"|"voice") => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      await fetch(`${API_URL}/api/keyboard-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ character: char, actionType: type, deviceId })
      })
    } catch {}
  }

  // Evento teclado físico: solo cuando NO hay Arduino conectado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isConnected || e.repeat) return

      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      const now = Date.now()
      if (now - lastPressRef.current < DEBOUNCE) return
      lastPressRef.current = now

      if (e.key === "Backspace") {
        textRef.current = textRef.current.slice(0, -1)
        setLastSymbol("⌫")
        onBackspace?.()
        logAction("⌫","backspace")
      } else if (e.key === " ") {
        textRef.current += " "
        setLastSymbol("␣")
        onSpace?.()
        addSymbol(" ")
        logAction(" ","space")
      } else if (e.key.length === 1) {
        const char = e.key.toLowerCase()
        addSymbol(char)
        logAction(char,"char")
        onTextInput(keyToBraille[char] ?? char)
      } else if (e.key === "Enter") {
        speakBuffer()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isConnected])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Teclado Braille
            </CardTitle>
            <CardDescription className="text-sm">
              Escribe con el teclado físico o conecta Arduino para usar pulsadores Braille.
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted p-2 rounded-md min-h-[60px] flex justify-center items-center">
          {lastSymbol ? (
            <div className="text-4xl font-mono">{lastSymbol}</div>
          ) : (
            <div className="text-xs flex items-center gap-1 opacity-70">
              <Info className="h-3 w-3" /> Presiona para escribir o LEER
            </div>
          )}
        </div>

        {recentSymbols.length > 0 && (
          <div>
            <p className="text-xs mb-2 font-medium">Últimos:</p>
            <div className="flex flex-wrap gap-1">
              {recentSymbols.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-lg">
                  {s === " " ? "␣" : s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected && (
            <Button variant="outline" onClick={async () => {
              const ports = await (navigator as any).serial.requestPort()
              await ports.open({ baudRate: 9600 })
              setPort(ports)
              setIsConnected(true)
              readSerial(ports)
              toast({ title: "Arduino conectado por primera vez" })
            }}>
              Conectar Arduino
            </Button>
          )}

          <Button onClick={speakBuffer}>Leer texto</Button>
        </div>
      </CardContent>
    </Card>
  )
}
