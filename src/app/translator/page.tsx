"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownUp, Copy, Volume2, History, KeyboardIcon, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageCapture } from "@/components/ImageCapture"
import { BrailleKeyboard } from "@/components/BrailleKeyboard"
import { useRouter } from "next/navigation"
import { generateTranslationPDF } from "@/lib/generatorPdf"

export default function TranslatorPage() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [translationDirection, setTranslationDirection] = useState<"tobraille" | "frombraille">("tobraille")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showBrailleKeyboard, setShowBrailleKeyboard] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastTranslationTime, setLastTranslationTime] = useState<Date | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Texto vacío",
        description: "Por favor, ingresa algún texto para traducir.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulate translation processing
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let result = ""

      if (translationDirection === "tobraille") {
        // Simple Spanish to Braille mapping
        const brailleMap: { [key: string]: string } = {
          a: "⠁",
          b: "⠃",
          c: "⠉",
          d: "⠙",
          e: "⠑",
          f: "⠋",
          g: "⠛",
          h: "⠓",
          i: "⠊",
          j: "⠚",
          k: "⠅",
          l: "⠇",
          m: "⠍",
          n: "⠝",
          o: "⠕",
          p: "⠏",
          q: "⠟",
          r: "⠗",
          s: "⠎",
          t: "⠞",
          u: "⠥",
          v: "⠧",
          w: "⠺",
          x: "⠭",
          y: "⠽",
          z: "⠵",
          " ": " ",
          ".": "⠲",
          ",": "⠂",
          "?": "⠦",
          "!": "⠖",
          á: "⠷",
          é: "⠮",
          í: "⠌",
          ó: "⠬",
          ú: "⠾",
          ñ: "⠻",
        }

        result = inputText
          .toLowerCase()
          .split("")
          .map((char) => brailleMap[char] || char)
          .join("")
      } else {
        // Simple Braille to Spanish mapping
        const spanishMap: { [key: string]: string } = {
          "⠁": "a",
          "⠃": "b",
          "⠉": "c",
          "⠙": "d",
          "⠑": "e",
          "⠋": "f",
          "⠛": "g",
          "⠓": "h",
          "⠊": "i",
          "⠚": "j",
          "⠅": "k",
          "⠇": "l",
          "⠍": "m",
          "⠝": "n",
          "⠕": "o",
          "⠏": "p",
          "⠟": "q",
          "⠗": "r",
          "⠎": "s",
          "⠞": "t",
          "⠥": "u",
          "⠧": "v",
          "⠺": "w",
          "⠭": "x",
          "⠽": "y",
          "⠵": "z",
          " ": " ",
          "⠲": ".",
          "⠂": ",",
          "⠦": "?",
          "⠖": "!",
          "⠷": "á",
          "⠮": "é",
          "⠌": "í",
          "⠬": "ó",
          "⠾": "ú",
          "⠻": "ñ",
        }

        result = inputText
          .split("")
          .map((char) => spanishMap[char] || char)
          .join("")
      }

      setOutputText(result)
      setLastTranslationTime(new Date())

      // Save to database if logged in
      if (isLoggedIn && user) {
        await saveTranslationToDatabase(inputText, result)
      }

      toast({
        title: "Traducción completada",
        description: isLoggedIn ? "Traducción guardada en tu historial" : "Traducción completada",
      })
    } catch (error) {
      console.error("Error during translation:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error durante la traducción. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveTranslationToDatabase = async (originalText: string, translatedText: string) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          originalText: originalText.trim(),
          brailleText: translatedText.trim(),
          translationType: translationDirection === "tobraille" ? "TEXT_TO_BRAILLE" : "BRAILLE_TO_TEXT",
          language: "es",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar traducción")
      }

      const data = await response.json()
      console.log("Translation saved successfully:", data)
    } catch (error: any) {
      console.error("Error saving translation:", error)
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la traducción en la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!inputText.trim() || !outputText.trim()) {
      toast({
        title: "No hay traducción",
        description: "Primero realiza una traducción para poder descargar el PDF.",
        variant: "destructive",
      })
      return
    }

    try {
      const translationData = {
        originalText: inputText,
        translatedText: outputText,
        // ensure the type is the literal union expected by generateTranslationPDF
        translationType: (translationDirection === "tobraille" ? "TEXT_TO_BRAILLE" : "BRAILLE_TO_TEXT") as
          | "TEXT_TO_BRAILLE"
          | "BRAILLE_TO_TEXT",
        timestamp: lastTranslationTime || new Date(),
        language: "es",
      }

      generateTranslationPDF(translationData)

      toast({
        title: "PDF generado",
        description: "La traducción se ha descargado como PDF exitosamente.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error al generar PDF",
        description: "Ocurrió un error al generar el archivo PDF. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleSwapDirection = () => {
    setTranslationDirection((prev) => (prev === "tobraille" ? "frombraille" : "tobraille"))
    setInputText(outputText)
    setOutputText(inputText)
  }

  const handleCopyToClipboard = async () => {
    if (!outputText) return

    try {
      await navigator.clipboard.writeText(outputText)
      toast({
        title: "Copiado",
        description: "El texto ha sido copiado al portapapeles.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto al portapapeles.",
        variant: "destructive",
      })
    }
  }

  const handleTextToSpeech = () => {
    if (!outputText) return

    if (translationDirection === "frombraille") {
      const utterance = new SpeechSynthesisUtterance(outputText)
      utterance.lang = "es-ES"
      utterance.rate = 0.8
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)

      toast({
        title: "Reproduciendo",
        description: "Reproduciendo texto en voz alta",
      })
    } else {
      toast({
        title: "No disponible",
        description: "La lectura de texto solo está disponible para texto en español.",
        variant: "destructive",
      })
    }
  }

  const handleBrailleKeyInput = (text: string) => {
    if (translationDirection === "frombraille") {
      const brailleMap: { [key: string]: string } = {
        a: "⠁",
        b: "⠃",
        c: "⠉",
        d: "⠙",
        e: "⠑",
        f: "⠋",
        g: "⠛",
        h: "⠓",
        i: "⠊",
        j: "⠚",
        k: "⠅",
        l: "⠇",
        m: "⠍",
        n: "⠝",
        o: "⠕",
        p: "⠏",
        q: "⠟",
        r: "⠗",
        s: "⠎",
        t: "⠞",
        u: "⠥",
        v: "⠧",
        w: "⠺",
        x: "⠭",
        y: "⠽",
        z: "⠵",
      }

      const brailleChar = brailleMap[text.toLowerCase()] || text
      setInputText((prev) => prev + brailleChar)
    } else {
      setInputText((prev) => prev + text)
    }
  }

  const handleClearText = () => {
    setInputText("")
    setOutputText("")
    setLastTranslationTime(null)
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Traductor de Braille</h1>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="image">Imagen</TabsTrigger>
          <TabsTrigger value="keyboard">Teclado Braille</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {translationDirection === "tobraille" ? "Español a Braille" : "Braille a Español"}
                {isSaving && <span className="text-sm text-blue-600 ml-2">(Guardando...)</span>}
              </CardTitle>
              <CardDescription>
                {translationDirection === "tobraille"
                  ? "Ingresa texto en español para convertirlo a Braille"
                  : "Ingresa texto en Braille para convertirlo a español"}
                {isLoggedIn && " • Las traducciones se guardan automáticamente"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translationDirection === "tobraille" ? "Español" : "Braille"}
                  </label>
                  <Textarea
                    placeholder={
                      translationDirection === "tobraille"
                        ? "Escribe texto en español..."
                        : "Escribe texto en Braille..."
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[200px] font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translationDirection === "tobraille" ? "Braille" : "Español"}
                  </label>
                  <Textarea
                    value={outputText}
                    readOnly
                    className="min-h-[200px] font-mono"
                    placeholder="Resultado de la traducción..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={handleTranslate} disabled={isLoading || !inputText.trim()}>
                  {isLoading ? "Traduciendo..." : "Traducir"}
                </Button>
                <Button variant="outline" onClick={handleSwapDirection}>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Cambiar dirección
                </Button>
                <Button variant="outline" onClick={handleCopyToClipboard} disabled={!outputText}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar resultado
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={!outputText}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTextToSpeech}
                  disabled={!outputText || translationDirection === "tobraille"}
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Leer en voz alta
                </Button>
                <Button variant="outline" onClick={() => setShowBrailleKeyboard(!showBrailleKeyboard)}>
                  <KeyboardIcon className="mr-2 h-4 w-4" />
                  {showBrailleKeyboard ? "Ocultar teclado" : "Mostrar teclado"}
                </Button>
                <Button variant="outline" onClick={handleClearText} disabled={!inputText && !outputText}>
                  Limpiar
                </Button>
                {isLoggedIn && (
                  <Button variant="outline" onClick={() => router.push("/history")}>
                    <History className="mr-2 h-4 w-4" />
                    Ver historial
                  </Button>
                )}
              </div>

              {showBrailleKeyboard && (
                <div className="mt-4">
                  <BrailleKeyboard onTextInput={handleBrailleKeyInput} />
                </div>
              )}

              {!isLoggedIn && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Tip:</strong> Inicia sesión para guardar automáticamente tus traducciones y acceder a tu
                    historial.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Traducir desde imagen</CardTitle>
              <CardDescription>Sube una imagen con texto en Braille para traducirla a español</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCapture
                onTextDetected={(text) => {
                  setTranslationDirection("frombraille")
                  setInputText(text)
                  setTimeout(() => handleTranslate(), 500)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyboard">
          <Card>
            <CardHeader>
              <CardTitle>Teclado Braille Virtual</CardTitle>
              <CardDescription>Utiliza el teclado virtual para escribir en Braille</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BrailleKeyboard onTextInput={handleBrailleKeyInput} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translationDirection === "tobraille" ? "Español" : "Braille"}
                  </label>
                  <Textarea
                    placeholder="El texto del teclado aparecerá aquí..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[150px] font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translationDirection === "tobraille" ? "Braille" : "Español"}
                  </label>
                  <Textarea
                    value={outputText}
                    readOnly
                    className="min-h-[150px] font-mono"
                    placeholder="Resultado de la traducción..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={handleTranslate} disabled={isLoading || !inputText.trim()}>
                  {isLoading ? "Traduciendo..." : "Traducir"}
                </Button>
                <Button variant="outline" onClick={handleSwapDirection}>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Cambiar dirección
                </Button>
                <Button variant="outline" onClick={handleCopyToClipboard} disabled={!outputText}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar resultado
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={!outputText}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTextToSpeech}
                  disabled={!outputText || translationDirection === "tobraille"}
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Leer en voz alta
                </Button>
                <Button variant="outline" onClick={handleClearText} disabled={!inputText && !outputText}>
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
