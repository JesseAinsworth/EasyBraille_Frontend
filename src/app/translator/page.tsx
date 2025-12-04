"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp, Copy, Volume2, History, VolumeX, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageCapture } from "@/components/ImageCapture"
import { BrailleKeyboard } from "@/components/BrailleKeyboard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { generateTranslationPDF } from "@/lib/generatorPdf"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

export default function TranslatorPage() {
  const [inputText, setInputText] = useState("") // ⬅️ Aquí recibimos Braille real
  const [outputText, setOutputText] = useState("") // ⬅️ Aquí mostrará español traducido
  const [translationDirection, setTranslationDirection] = useState<"tobraille" | "frombraille">("frombraille")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [lastTranslationTime, setLastTranslationTime] = useState<Date | null>(null)
  const [keyboardConnected, setKeyboardConnected] = useState(false)
  const [autoVoice, setAutoVoice] = useState(true)
  const [activeTab, setActiveTab] = useState("keyboard") // Estado para controlar pestaña activa

  // 🔊 Ref para leer todo el texto español cuando Arduino mande CTRL+SHIFT+V
  const spanishTextRef = useRef("")
  const { toast } = useToast()
  const router = useRouter()

  // ------------------ Detectar parámetro URL para abrir pestaña específica ------------------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'keyboard' || tab === 'text' || tab === 'image') {
        setActiveTab(tab)
      }
    }
  }, [])

  // ------------------ Manejar entrada del teclado Arduino ------------------
  const handleBrailleKeyInput = (text: string) => {
    console.log("📝 Texto recibido en traductor:", text)
    
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
    
    const lowerText = text.toLowerCase()
    let brailleChar = brailleMap[text]
    if (!brailleChar) {
      brailleChar = brailleMap[lowerText]
    }
    
    if (brailleChar) {
      console.log("✅ Agregando a Braille:", brailleChar, "y a Español:", text)
      setInputText((prev) => prev + brailleChar)
      setOutputText((prev) => prev + text)
      spanishTextRef.current += text
      console.log("📝 Texto español acumulado:", spanishTextRef.current)
      
      if (autoVoice) {
        speakText(text)
      }
    } else {
      console.warn("⚠️ Carácter no soportado:", text)
    }
  }

  const handleTextInput = handleBrailleKeyInput

  // ------------------ Función para leer texto con voz ------------------
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "es-ES"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  // ------------------ Botón de voz para leer resultado completo ------------------
  const handleVoiceButton = async () => {
    console.log("🔊 Botón de voz presionado")
    console.log("📝 Texto en spanishTextRef:", spanishTextRef.current)
    
    if (!spanishTextRef.current.trim()) {
      console.warn("⚠️ No hay texto para leer")
      toast({
        title: "Sin texto",
        description: "No hay texto español para leer",
        variant: "destructive",
      })
      return
    }
    
    if (!window.speechSynthesis) {
      console.warn("⚠️ speechSynthesis no disponible")
      return
    }
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spanishTextRef.current)
    utterance.lang = "es-ES"
    utterance.rate = 0.9
    console.log("🔊 Leyendo:", spanishTextRef.current)
    window.speechSynthesis.speak(utterance)
    
    toast({
      title: "Leyendo texto",
      description: `Leyendo: ${spanishTextRef.current}`,
    })
  }

  // ------------------ Limpiar texto ------------------
  const handleClearText = () => {
    setInputText("")
    setOutputText("")
    spanishTextRef.current = ""
    toast({
      title: "Texto limpiado",
      description: "Los campos han sido limpiados",
    })
  }

  // ------------------ Verificar si usuario está logueado ------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch {}
    }
  }, [])

  // ------------------ Traducir Braille → Español (cuando usuario lo haga) ------------------
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Texto vacío",
        description: "No hay texto en Braille para traducir.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mapa de Braille → Español
      const brailleToSpanish: Record<string, string> = {
        "⠁": "a","⠃":"b","⠉":"c","⠙":"d","⠑":"e","⠋":"f",
        "⠛":"g","⠓":"h","⠊":"i","⠚":"j","⠅":"k","⠇":"l",
        "⠍":"m","⠝":"n","⠕":"o","⠏":"p","⠟":"q","⠗":"r",
        "⠎":"s","⠞":"t","⠥":"u","⠧":"v","⠺":"w","⠭":"x",
        "⠽":"y","⠵":"z","⠷":"á","⠮":"é","⠌":"í","⠬":"ó",
        "⠾":"ú","⠻":"ñ","⠲":".","⠂":",","⠦":"?","⠖":"!",
        " ":" "
      }

      const translated = inputText
        .split("")
        .map((c) => brailleToSpanish[c] ?? c)
        .join("")

      setOutputText(translated)
      spanishTextRef.current = translated
      spanishTextRef.current && (spanishTextRef.current += "")
      setLastTranslationTime(new Date())

      if (isLoggedIn && user) {
        await saveTranslationToDatabase(inputText, translated)
      }

      toast({
        title: "✅ Traducción completada",
        description: isLoggedIn ? "Guardada en tu historial." : "Proceso finalizado.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Ocurrió un error al traducir.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------- Guardar traducción en BD ------------------
  const saveTranslationToDatabase = async (originalBraille: string, translatedSpanish: string) => {
    try {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) throw new Error("Usuario no autenticado")
      const userId = JSON.parse(storedUser).userId
      if (!userId) throw new Error("ID no encontrado")

      await fetch(`${BACKEND_URL}/api/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          originalText: originalBraille.trim(),
          brailleText: translatedSpanish.trim(),
          translationType: "BRAILLE_TO_TEXT",
          language: "es"
        })
      })
    } catch {}
  }

  // ------------------ Copiar resultado Español ------------------
  const handleCopy = async () => {
    if (!outputText) return
    await navigator.clipboard.writeText(outputText)
    toast({ title: "Copiado ✅", description: "Texto español copiado." })
  }

  // ------------------ Descargar PDF ------------------
  const handleDownloadPDF = () => {
    if (!inputText.trim() || !outputText.trim()) {
      toast({ title: "Error", description: "Primero traduce el texto.", variant: "destructive"})
      return
    }

    generateTranslationPDF({
      originalText: inputText,
      translatedText: outputText,
      translationType: "BRAILLE_TO_TEXT",
      timestamp: lastTranslationTime || new Date(),
      language: "es"
    })
  }

  // ------------------ Leer texto Español (desde Arduino o desde botón web) ------------------
  const handleVoice = () => {
    if (!outputText.trim()) {
      toast({ title: "Sin texto", description: "No hay español para leer.", variant: "destructive"})
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(outputText)
    u.lang = "es-ES"
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  // ------------------ Detectar LEER desde Arduino Serial (palabra LEER) ------------------
  useEffect(() => {
    const connectSerial = async () => {
      if (!("serial" in navigator)) return
      try {
        const port = await (navigator as any).serial.requestPort()
        await port.open({ baudRate: 9600 })
        setKeyboardConnected(true)
        toast({ title: "Teclado Braille detectado ✅", description: "Conectado por Serial." })
        const reader = port.readable.getReader()
        while (true) {
          const { value } = await reader.read()
          if (value) {
            const txt = new TextDecoder().decode(value)
            if (txt.includes("LEER")) {
              console.log("🔊 Leer activado por Arduino")
              handleVoice()
            }
          }
        }
      } catch {}
    }
    connectSerial()
  }, [])

  // ------------------ Detectar combinación Ctrl+Shift+V (Botón físico VOZ Arduino HID) ------------------
  useEffect(() => {
    const voiceListener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "V" || e.key === "v")) {
        console.log("🔊 Leer desde Arduino HID")
        handleVoice()
      }
    }
    window.addEventListener("keydown", voiceListener)
    return () => window.removeEventListener("keydown", voiceListener)
  }, [outputText])

  // ------------------ UI ------------------
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Traductor de Braille</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="image">Imagen</TabsTrigger>
          <TabsTrigger value="keyboard">Teclado Braille</TabsTrigger>
        </TabsList>

        {/* ---------- Texto ---------- */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Braille a Español</CardTitle>
              <CardDescription>Escribe o pega texto en Braille</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="⠓⠕⠇⠁..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] text-2xl font-mono"
              />

              <div className="flex justify-center flex-wrap gap-3">
                <Button onClick={handleTranslate} disabled={isLoading}>Traducir</Button>
                <Button variant="outline" onClick={handleVoice}><Volume2 className="mr-2"/>Leer español</Button>
                <Button variant="outline" onClick={handleCopy}><Copy className="mr-2"/>Copiar</Button>
                <Button variant="outline" onClick={handleDownloadPDF}><Download className="mr-2"/>PDF</Button>
                <Button variant="outline" onClick={handleClearText}><VolumeX className="mr-2"/>Limpiar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Imagen ---------- */}
        <TabsContent value="image">
          <ImageCapture
            onTextDetected={(text) => {
              setOutputText("")
              setInputText(text)
              setTimeout(() => handleTranslate(), 500)
            }}
          />
        </TabsContent>

        {/* ---------- Teclado Arduino ---------- */}
        <TabsContent value="keyboard">
          <Card>
            <CardHeader>
              <CardTitle>Entrada desde teclado Arduino</CardTitle>
              <CardDescription>Escribe con tu teclado Braille y ve la traducción en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Componente teclado Arduino */}
              <BrailleKeyboard 
                onTextInput={handleBrailleKeyInput}
                onVoiceButtonPress={handleVoiceButton}
              />

              {/* Switch de voz automática */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label htmlFor="auto-voice" className="text-sm font-medium cursor-pointer">
                      Voz automática
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Leer cada letra al escribir
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto-voice"
                  checked={autoVoice}
                  onCheckedChange={setAutoVoice}
                />
              </div>

              {/* Dos campos: Braille y Español */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Braille</label>
                  <Textarea
                    placeholder="⠃⠗⠁⠊⠇⠇⠑..."
                    value={inputText}
                    readOnly
                    className="min-h-[200px] text-3xl font-mono text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Español</label>
                  <Textarea
                    placeholder="braille..."
                    value={outputText}
                    readOnly
                    className="min-h-[200px] text-2xl font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex justify-center flex-wrap gap-3">
                <Button variant="outline" onClick={handleVoiceButton}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  🔊 Leer español
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  📋 Copiar
                </Button>
                <Button variant="outline" onClick={handleClearText}>
                  <VolumeX className="mr-2 h-4 w-4" />
                  🧹 Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
