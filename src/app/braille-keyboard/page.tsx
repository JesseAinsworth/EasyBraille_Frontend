"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { BrailleKeyboard } from "@/components/BrailleKeyboard"
import { BrailleKeyboardGuide } from "@/components/BrailleKeyboardGuide"
import { ArrowLeft, Volume2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function BrailleKeyboardPage() {
  const [inputText, setInputText] = useState("") // ⬅️ Aquí se acumula Braille real
  const [outputText, setOutputText] = useState("") // ⬅️ Aquí puedes poner después la traducción si quieres
  const [keyboardConnected, setKeyboardConnected] = useState(false)
  const [autoVoice, setAutoVoice] = useState(false) // Desactivado por defecto porque no leerá Braille

  const textBufferRef = useRef("")
  const { toast } = useToast()

  // ------------------ 🔊 Leer texto en español (si existe) ------------------
  const handleVoice = () => {
    const textToRead = textBufferRef.current || outputText
    
    if (!textToRead.trim()) {
      toast({
        title: "Sin texto",
        description: "No hay texto en español para leer.",
        variant: "destructive",
        duration: 2000
      })
      return
    }

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToRead)
      utterance.lang = "es-ES"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
      
      toast({
        title: "🔊 Leyendo texto",
        description: `Leyendo: ${textToRead}`,
        duration: 2000
      })
    } catch (error) {
      console.error("Error de voz:", error)
    }
  }

  // ------------------ ✍ Recibir Braille del teclado físico ------------------
  const handleTextInput = (text: string) => {
    console.log("🟢 Texto recibido:", text)

    // Convertir letras y números a símbolos Braille
    const brailleMap: { [key: string]: string } = {
      a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋",
      g: "⠛", h: "⠓", i: "⠊", j: "⠚", k: "⠅", l: "⠇",
      m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗",
      s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
      y: "⠽", z: "⠵",
      "1": "⠼⠁", "2": "⠼⠃", "3": "⠼⠉", "4": "⠼⠙", "5": "⠼⠑",
      "6": "⠼⠋", "7": "⠼⠛", "8": "⠼⠓", "9": "⠼⠊", "0": "⠼⠚",
      "+": "⠐⠖", "-": "⠤", "*": "⠐⠦", "/": "⠸⠌", "=": "⠐⠶",
      " ": " ",
    }

    if (!keyboardConnected) {
      setKeyboardConnected(true)
      toast({
        title: "✅ Teclado Braille detectado",
        description: "Tu teclado Arduino está conectado.",
        duration: 2000
      })
    }

    const lowerText = text.toLowerCase()
    let brailleChar = brailleMap[text]
    if (!brailleChar) {
      brailleChar = brailleMap[lowerText]
    }

    // Solo agregar si existe el símbolo Braille
    if (brailleChar) {
      console.log("✅ Agregando a Braille:", brailleChar, "y a Español:", text)
      
      // Campo Braille muestra SOLO símbolos Braille
      setInputText(prev => prev + brailleChar)
      
      // Campo Español muestra SOLO letras/números
      setOutputText(prev => prev + text)
      
      textBufferRef.current += text
      logAction(text, "char")
      
      // Leer automáticamente si está activado
      if (autoVoice) {
        speakText(text)
      }
    } else {
      console.warn("⚠️ Carácter no soportado:", text)
    }
  }

  // Función para leer texto individual
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "es-ES"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const logAction = (value: string, type: string) => {
    console.log("⌨️ Enviando:", { value, type })

    // Aquí va tu lógica real para API, por ahora simulado:
    // Ejemplo:
    // axios.post("/api/keyboard", { value, type })
  }

  // ------------------ 🧹 Botón limpiar ------------------
  const handleClear = () => {
    setInputText("")
    setOutputText("")
    textBufferRef.current = ""
    setKeyboardConnected(false)
    toast({
      title: "🧹 Limpiado",
      description: "El texto ha sido eliminado.",
      duration: 2000
    })
  }

  // ------------------ Detectar botón de Voz enviado por Arduino (Ctrl+Shift+V) ------------------
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "V" || e.key === "v")) {
        e.preventDefault()
        console.log("🔊 Botón de voz activado desde Arduino")
        handleVoice()
      }
    }

    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [textBufferRef.current])

  // ------------------ UI ------------------
  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/translator">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Teclado Braille Arduino</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="keyboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="keyboard">Teclado</TabsTrigger>
              <TabsTrigger value="code">Código Arduino</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            {/* ---------- Pestaña Teclado ---------- */}
            <TabsContent value="keyboard">
              <Card>
                <CardHeader>
                  <CardTitle>Braille → Entrada directa</CardTitle>
                  <CardDescription>
                    Escribe con tu teclado físico Arduino. Aquí se recibe Braille real.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Componente virtual */}
                  <BrailleKeyboard 
                    onTextInput={handleTextInput}
                  />

                  {/* Textareas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Braille</label>
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[150px] font-mono text-2xl"
                        placeholder="⠃⠗⠁⠊⠇⠇⠑"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Español (Opcional)</label>
                      <Textarea
                        value={outputText}
                        onChange={(e) => setOutputText(e.target.value)}
                        className="min-h-[150px] font-mono"
                        placeholder="Aquí puedes escribir la traducción si quieres"
                      />
                    </div>
                  </div>

                  {/* Switch voz */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <Label htmlFor="auto-voice" className="text-sm font-medium cursor-pointer">
                          Voz automática
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Desactivado para Braille (no recomendado), activo solo si lees español
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="auto-voice"
                      checked={autoVoice}
                      onCheckedChange={setAutoVoice}
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleVoice}>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Leer en español
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                      Limpiar
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- Pestaña Código (solo visual) ---------- */}
            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Código Arduino</CardTitle>
                  <CardDescription>El código que tienes en tu teclado físico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                    <pre className="text-xs">
{`(Tu código Arduino permanece aquí sin cambios visuales)`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- Pestaña Configuración ---------- */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>Ajustes del teclado físico</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    El teclado físico debe enviar Unicode Braille real por Serial. Si está enviando letras normales,
                    asegúrate de actualizar el firmware (sketch) para que mande `Keyboard.write()` con códigos Alt Unicode.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Guía visual */}
        <div>
          <BrailleKeyboardGuide />
        </div>
      </div>
    </div>
  )
}
