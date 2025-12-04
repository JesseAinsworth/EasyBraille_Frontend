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
  onTextInput: (symbol: string) => void
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
  const keepReadingRef = useRef(false)
  const bufferRef = useRef("")
  const textBufferRef = useRef("")
  const lastPressRef = useRef(0)
  const DEBOUNCE = 120

  useEffect(() => {
    const stored = localStorage.getItem("brailleDeviceId")
    if (stored) setDeviceId(stored)
    else {
      const id = `keyboard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem("brailleDeviceId", id)
      setDeviceId(id)
    }
  }, [])

  useEffect(() => {
    const auth = localStorage.getItem("serialAuthorized")
    if (auth === "yes" && "serial" in navigator) {
      (navigator as any).serial.getPorts().then(async (ports: any[]) => {
        if (ports.length > 0) {
          try {
            await ports[0].open({ baudRate: 9600 })
            setPort(ports[0])
            setIsConnected(true)
            startReading(ports[0])
            toast({ title: "Arduino reconectado automáticamente ✅" })
          } catch (e) {
            console.error(e)
          }
        }
      })
    }
  }, [])

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

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "es-MX"
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  const addSymbolToUI = (char: string) => {
    const symbol = keyToBraille[char] ?? char
    setLastSymbol(symbol)
    setRecentSymbols(prev => [...prev, symbol].slice(-12))
  }

  const startReading = async (thePort: any) => {
    keepReadingRef.current = true
    const reader = thePort.readable?.getReader()
    if (!reader) return
    readerRef.current = reader

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) bufferRef.current += new TextDecoder().decode(value)

        const lines = bufferRef.current.split(/\r?\n/)
        bufferRef.current = lines.pop() ?? ""

        for (const l of lines) handleSerialLine(l.trim())
      }
    } catch (e) {
      console.error(e)
    } finally {
      reader.releaseLock()
      keepReadingRef.current = false
    }
  }

  const handleSerialLine = (line: string) => {
    if (!line) return

    if (line.toUpperCase() === "LEER") {
      speak(textBufferRef.current || "No hay texto para leer")
      logAction("LEER", "voice")
      return
    }

    if (line.startsWith("Carácter detectado:")) {
      const char = line.split(":")[1].trim()

      if (char === "⌫" || char.toUpperCase() === "BACKSPACE") {
        textBufferRef.current = textBufferRef.current.slice(0, -1)
        onBackspace?.()
        setLastSymbol("⌫")
        addSymbolToUI("⌫")
        logAction("⌫","backspace")
        return
      }

      if (char === " ") {
        textBufferRef.current += " "
        onSpace?.()
        setLastSymbol("␣")
        addSymbolToUI(" ")
        logAction(" ","space")
        return
      }

      const lower = char.toLowerCase()
      textBufferRef.current += lower
      addSymbolToUI(lower)
      onTextInput(keyToBraille[lower] ?? lower)
      logAction(lower, "char")
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isConnected || e.repeat) return
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      const now = Date.now()
      if (now - lastPressRef.current < DEBOUNCE) return
      lastPressRef.current = now

      if (e.key === "Backspace") {
        textBufferRef.current = textBufferRef.current.slice(0, -1)
        onBackspace?.()
        setLastSymbol("⌫")
        addSymbolToUI("⌫")
        logAction("⌫","backspace")

      } else if (e.key === " ") {
        textBufferRef.current += " "
        onSpace?.()
        setLastSymbol("␣")
        addSymbolToUI("␣")
        logAction(" ","space")

      } else if (e.key.length === 1) {
        const char = e.key.toLowerCase()
        const braille = keyToBraille[char] ?? char
        textBufferRef.current += char
        onTextInput(braille)
        addSymbolToUI(char)
        logAction(char, "char")

      } else if (e.key === "Enter") {
        speakBuffer()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isConnected])

  const speakBuffer = () => speak(textBufferRef.current || "No hay texto para leer")

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) return
      const selectedPort = await (navigator as any).serial.requestPort()
      await selectedPort.open({ baudRate: 9600 })

      setPort(selectedPort)
      setIsConnected(true)
      startReading(selectedPort)
      localStorage.setItem("serialAuthorized","yes")

      toast({ title: "Arduino conectado ✅" })
    } catch (e) {
      console.error(e)
    }
  }

  const disconnectSerial = async () => {
    try {
      keepReadingRef.current = false
      await readerRef.current?.cancel()
      await port?.close()

      setPort(null)
      setIsConnected(false)
      toast({ title: "Puerto serial desconectado ❌" })
    } catch {}
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" /> Teclado Braille
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
          {!isConnected ? (
            <Button variant="outline" onClick={() => connectSerial()}>
              Conectar Arduino
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => disconnectSerial()}>
              Desconectar
            </Button>
          )}

          <Button onClick={() => speakBuffer()}>🔊 Leer texto</Button>
        </div>

      </CardContent>
    </Card>
  )
}
