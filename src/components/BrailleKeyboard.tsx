"use client"

import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Keyboard, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ====== NUEVO: Mapa combinación de puntos → Braille Unicode ======
function convertirPuntosABraille(combo: string): string {
  const tablaPuntos: Record<string, number> = {
    "1": 0b100000,
    "2": 0b010000,
    "3": 0b001000,
    "4": 0b000100,
    "5": 0b000010,
    "6": 0b000001
  }

  const mapaUnicode: Record<number, string> = {
    0b100000: "⠁",
    0b010000: "⠂",
    0b001000: "⠄",
    0b000100: "⡀",
    0b000010: "⢀",
    0b000001: "⠠",
    0b110000: "⠃",
    0b100100: "⠉",
    0b100110: "⠙",
    0b110100: "⠋",
    0b110110: "⠛",
    0b110010: "⠓",
    0b010100: "⠊",
    0b010110: "⠚",
    0b101000: "⠅",
    0b111000: "⠇",
    0b101101: "⠭",
    0b101111: "⠽",
    0b101011: "⠵",
    0b000000: " "
  }

  let codigo = 0
  const partes = combo.split("+")

  for (const p of partes) {
    if (tablaPuntos[p]) {
      codigo |= tablaPuntos[p]
    }
  }

  return mapaUnicode[codigo] || "?" // si no existe combinación devuelve ?
}

// ====== NUEVO: Sonido al presionar e insertar ======
function reproducirSonido(archivo: string) {
  const audio = new Audio(archivo)
  audio.play().catch(() => {})
}

// ====== NUEVO: Voz ======
function leerEnVoz(texto: string) {
  if (!("speechSynthesis" in window)) return
  const voz = new SpeechSynthesisUtterance(texto)
  voz.lang = "es-MX"
  speechSynthesis.cancel()
  speechSynthesis.speak(voz)
}

// ====== Mapeo de letras a símbolos Braille ======
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

// ====== Integraciones previas se conservan ======
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

interface BrailleKeyboardProps {
  onTextInput: (symbol: string) => void
  onBackspace?: () => void
  onSpace?: () => void
}

export function BrailleKeyboard({
  onTextInput,
  onBackspace,
  onSpace
}: BrailleKeyboardProps) {

  const [isConnected, setIsConnected] = useState(false)
  const [lastSymbol, setLastSymbol] = useState<string | null>(null)
  const [recentSymbols, setRecentSymbols] = useState<string[]>([])
  const [deviceId, setDeviceSerialId] = useState("")
  const [port, setPort] = useState<any>(null)

  const { toast } = useToast()
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const continuarLecturaRef = useRef(false)
  const bufferSerialRef = useRef("")
  const textoBrailleRef = useRef("") // almacena lo escrito en Braille
  const bufferComboRef = useRef("") // almacena 1+3+5 etc
  const ultimoTiempoRef = useRef(0)
  const DEBOUNCE = 120

  useEffect(() => {
    const saved = localStorage.getItem("brailleDeviceId")
    if (saved) setDeviceSerialId(saved)
    else {
      const id = `keyboard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem("brailleDeviceId", id)
      setDeviceSerialId(id)
    }
  }, [])

  const speak = (text: string) => leerEnVoz(text)

  const addSymbolToUI = (unicode: string) => {
    setLastSymbol(unicode)
    setRecentSymbols(prev => [...prev, unicode].slice(-12))
  }

  const speakBuffer = () =>
    leerEnVoz(textoBrailleRef.current || "No hay texto para leer")

  const startReading = async (thePort: any) => {
    continuarLecturaRef.current = true
    const lector = thePort.readable?.getReader()
    if (!lector) return
    readerRef.current = lector

    try {
      while (continuarLecturaRef.current) {
        const { value, done } = await lector.read()
        if (done) break
        if (value) bufferSerialRef.current += new TextDecoder().decode(value)

        const lineas = bufferSerialRef.current.split(/\r?\n/)
        bufferSerialRef.current = lineas.pop() ?? ""

        for (const l of lineas) procesarLinea(l.trim())
      }
    } catch (e) {
      console.error(e)
    } finally {
      lector.releaseLock()
      continuarLecturaRef.current = false
    }
  }

  const procesarLinea = (line: string) => {
    if (!line) return

    if (line.toUpperCase() === "LEER") {
      leerEnVoz(textoBrailleRef.current || "No hay texto para leer")
      return
    }

    if (line.startsWith("Carácter detectado:")) {
      const char = line.split(":")[1].trim()

      if (char === "⌫" || char.toUpperCase() === "BACKSPACE") {
        textoBrailleRef.current = textoBrailleRef.current.slice(0, -1)
        onBackspace?.()
        addSymbolToUI("⌫")
        return
      }

      if (char === " ") {
        textoBrailleRef.current += " "
        onSpace?.()
        addSymbolToUI("␣")
        return
      }

      const braille = keyToBraille[char.toLowerCase()] ?? char.toLowerCase()
      textoBrailleRef.current += braille
      onTextInput(braille)
      addSymbolToUI(braille)
    }
  }

  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (isConnected || e.repeat) return
      const objetivo = e.target as HTMLElement
      if (objetivo.tagName === "INPUT" || objetivo.tagName === "TEXTAREA") return

      const ahora = Date.now()
      if (ahora - ultimoTiempoRef.current < DEBOUNCE) return
      ultimoTiempoRef.current = ahora

      // ==== NUEVO: capturar puntos 1-6 y "+" para formar combinaciones ====
      if ((e.key >= "1" && e.key <= "6") || e.key === "+") {
        bufferComboRef.current += e.key
        reproducirSonido("/dot.mp3")
        return
      }

      // ==== NUEVO: cuando presiona Enter convierte la combinación a Braille ====
      if (e.key === "Enter") {
        const braille = convertirPuntosABraille(bufferComboRef.current)
        textoBrailleRef.current += braille
        onTextInput(braille)
        addSymbolToUI(braille)
        reproducirSonido("/read.mp3")
        leerEnVoz(`Símbolo braille insertado ${braille}`)
        bufferComboRef.current = ""
        bufferComboRef.current = ""
        return
      }

      if (e.key === "Backspace") {
        textoBrailleRef.current = textoBrailleRef.current.slice(0, -1)
        onBackspace?.()
        addSymbolToUI("⌫")
        leerEnVoz("Borrar")
        return
      }

      if (e.key === " ") {
        textoBrailleRef.current += " "
        onSpace?.()
        onTextInput(" ")
        addSymbolToUI("␣")
        leerEnVoz("Espacio")
        return
      }

      // ==== Convertir letras normales a Braille ====
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        const char = e.key.toLowerCase()
        const braille = keyToBraille[char] ?? char
        textoBrailleRef.current += braille
        onTextInput(braille)
        addSymbolToUI(braille)
        return
      }
    };

    window.addEventListener("keydown", manejarTecla)
    return () => window.removeEventListener("keydown", manejarTecla)

  }, [isConnected])

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) return
      const seleccionado = await (navigator as any).serial.requestPort()
      await seleccionado.open({ baudRate: 9600 })

      setPort(seleccionado)
      setIsConnected(true)
      startReading(seleccionado)
      
      localStorage.setItem("serialAuthorized", "yes")
      toast({ title: "Arduino conectado ✅" })

    } catch (e) {
      console.error(e)
    }
  }

  const disconnectSerial = async () => {
    try {
      continuarLecturaRef.current = false
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
              Presiona combinaciones 1+3+5 + Enter para escribir en Braille real.
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
                  {s}
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

        <p className="text-xs text-gray-500">
          Texto almacenado (Braille): {textoBrailleRef.current || "vacío"}
        </p>

      </CardContent>
    </Card>
  )
}
