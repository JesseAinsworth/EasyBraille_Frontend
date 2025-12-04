"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Keyboard, Info, Usb, X } from "lucide-react"
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
  const [serialSupported, setSerialSupported] = useState(false)
  const [numericPrefix, setNumericPrefix] = useState(false)
  const portRef = useRef<any | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const { toast } = useToast()

  // Verificar soporte de Web Serial API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      setSerialSupported(true)
    }
  }, [])

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

  // Conectar al puerto serial
  const connectSerial = async () => {
    try {
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 9600 })
      portRef.current = port

      setIsConnected(true)
      toast({
        title: "✅ Arduino conectado",
        description: "Teclado Braille Arduino conectado por USB exitosamente",
      })

      // Leer datos del puerto serial
      readSerialData(port)
    } catch (error: any) {
      console.error("Error al conectar:", error)
      
      let errorMessage = "No se pudo conectar al Arduino"
      if (error.message?.includes("Failed to open serial port")) {
        errorMessage = "El puerto está siendo usado por otra aplicación. Cierra el Serial Monitor de Arduino IDE y vuelve a intentar."
      }
      
      toast({
        title: "❌ Error de conexión",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Desconectar del puerto serial
  const disconnectSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
      setIsConnected(false)
      toast({
        title: "Arduino desconectado",
        description: "Teclado Braille Arduino desconectado",
      })
    } catch (error) {
      console.error("Error al desconectar:", error)
    }
  }

  // Leer datos del puerto serial
  const readSerialData = async (port: any) => {
    const textDecoder = new TextDecoderStream()
    const readableStreamClosed = port.readable!.pipeTo(textDecoder.writable)
    const reader = textDecoder.readable.getReader()
    readerRef.current = reader

    let buffer = ""

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          // Detectar espacio ANTES de trim (para no perder el espacio)
          if (line.includes("Carácter detectado:  ")) {
            console.log("␣ Espacio detectado")
            setLastKey("␣")
            onTextInput(" ")
            continue
          }
          
          const trimmedLine = line.trim()
          console.log("📡 Serial recibido:", trimmedLine)

          // Detectar comando LEER del Arduino
          if (trimmedLine === "LEER") {
            console.log("🔊 Comando LEER detectado!")
            setLastKey("🔊")
            if (onVoiceButtonPress) {
              console.log("🔊 Llamando onVoiceButtonPress")
              onVoiceButtonPress()
            } else {
              console.warn("⚠️ onVoiceButtonPress no está definido")
            }
          }
          // Detectar backspace
          else if (trimmedLine.startsWith("Carácter detectado: ⌫")) {
            console.log("⌫ Backspace detectado")
            setLastKey("⌫")
            onTextInput("BACKSPACE")
          }
          // Detectar prefijo numérico
          else if (trimmedLine.startsWith("Carácter detectado: ⠼")) {
            console.log("🔢 Prefijo numérico detectado")
            setNumericPrefix(true)
          }
          // Detectar caracteres del teclado Braille
          else if (trimmedLine.startsWith("Carácter detectado:")) {
            const char = trimmedLine.split(":")[1]?.trim()
            if (char) {
              console.log("🔤 Carácter detectado:", char)
              
              // Si hay prefijo numérico activo, convertir a número
              if (numericPrefix) {
                const numberMap: Record<string, string> = {
                  "⠁": "1", "⠃": "2", "⠉": "3", "⠙": "4", "⠑": "5",
                  "⠋": "6", "⠛": "7", "⠓": "8", "⠊": "9", "⠚": "0"
                }
                const number = numberMap[char]
                if (number) {
                  console.log("✅ Número detectado:", number)
                  setLastKey(number)
                  setDetectedKeys((prev) => {
                    const newKeys = [...prev, number]
                    if (newKeys.length > 10) {
                      return newKeys.slice(newKeys.length - 10)
                    }
                    return newKeys
                  })
                  onTextInput(number)
                  logKeyboardAction(number, "char")
                  setNumericPrefix(false)
                  continue
                }
                setNumericPrefix(false)
              }
              
              // Convertir símbolo Braille a letra
              const letter = brailleToLetter(char)
              if (letter) {
                console.log("✅ Letra detectada:", letter)
                setLastKey(letter)
                setDetectedKeys((prev) => {
                  const newKeys = [...prev, letter]
                  if (newKeys.length > 10) {
                    return newKeys.slice(newKeys.length - 10)
                  }
                  return newKeys
                })
                onTextInput(letter)
                logKeyboardAction(letter, "char")
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error leyendo serial:", error)
    }
  }

  // Convertir símbolo Braille a letra
  const brailleToLetter = (braille: string): string | null => {
    const brailleMap: Record<string, string> = {
      "⠁": "a", "⠃": "b", "⠉": "c", "⠙": "d", "⠑": "e", "⠋": "f",
      "⠛": "g", "⠓": "h", "⠊": "i", "⠚": "j", "⠅": "k", "⠇": "l",
      "⠍": "m", "⠝": "n", "⠕": "o", "⠏": "p", "⠟": "q", "⠗": "r",
      "⠎": "s", "⠞": "t", "⠥": "u", "⠧": "v", "⠺": "w", "⠭": "x",
      "⠽": "y", "⠵": "z",
      "⠼⠁": "1", "⠼⠃": "2", "⠼⠉": "3", "⠼⠙": "4", "⠼⠑": "5",
      "⠼⠋": "6", "⠼⠛": "7", "⠼⠓": "8", "⠼⠊": "9", "⠼⠚": "0",
      "⠐⠖": "+", "⠤": "-", "⠐⠦": "*", "⠸⠌": "/", "⠐⠶": "=",
      " ": " ",
    }
    return brailleMap[braille] || null
  }

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
    // Solo usar el listener del teclado si NO está conectado el Arduino
    if (isConnected && portRef.current) {
      console.log("🔌 Arduino conectado - deshabilitando listener de teclado PC")
      return
    }

    console.log("⌨️ Modo simulación - habilitando listener de teclado PC")
    
    // Función para manejar eventos de teclado
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detectar combinación Ctrl+Shift+V para simular botón de voz
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault()
        event.stopPropagation()
        
        if (onVoiceButtonPress) {
          console.log("🔊 Ctrl+Shift+V presionado - llamando onVoiceButtonPress")
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
  }, [onTextInput, onVoiceButtonPress, deviceId, toast, isConnected])

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.cancel().catch(console.error)
      }
      if (portRef.current) {
        portRef.current.close().catch(console.error)
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
            <CardDescription>Conecta tu teclado Braille Arduino para escribir directamente</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "outline"}>{isConnected ? "Conectado" : "Desconectado"}</Badge>
            {serialSupported && (
              isConnected ? (
                <Button size="sm" variant="outline" onClick={disconnectSerial}>
                  <X className="h-4 w-4 mr-1" />
                  Desconectar
                </Button>
              ) : (
                <Button size="sm" onClick={connectSerial}>
                  <Usb className="h-4 w-4 mr-1" />
                  Conectar Arduino
                </Button>
              )
            )}
          </div>
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
            {serialSupported ? (
              <>
                <p className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  {isConnected 
                    ? "✅ Teclado Arduino conectado por USB. Los caracteres se detectan automáticamente."
                    : "⚠️ Cierra el Serial Monitor de Arduino IDE antes de conectar."}
                </p>
                {onVoiceButtonPress && isConnected && (
                  <p className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    🔊 Presiona el botón de voz físico en el Arduino para leer el resultado.
                  </p>
                )}
                {onVoiceButtonPress && !isConnected && (
                  <p className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Info className="h-4 w-4" />
                    Presiona <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs font-mono mx-1">Ctrl+Shift+V</kbd> para leer el texto (modo simulación).
                  </p>
                )}
              </>
            ) : (
              <p className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Tu navegador no soporta Web Serial API. Usa Chrome, Edge o Opera para conectar el Arduino.
              </p>
            )}
            {!isConnected && serialSupported && (
              <p className="flex items-center gap-1 text-muted-foreground text-xs">
                <Info className="h-3 w-3" />
                Modo simulación: escribe con el teclado de tu computadora.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}