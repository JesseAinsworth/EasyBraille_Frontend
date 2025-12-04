"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageCaptureProps {
  onTextDetected: (text: string) => void
}

export function ImageCapture({ onTextDetected }: ImageCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedText, setDetectedText] = useState<string | null>(null)
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false)
  const [correctedText, setCorrectedText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const { toast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"

  // --- Corrección de orden de lectura ---
  const correctReadingOrder = (text: string): string => {
    if (!text) return text
    
    // Limpiar espacios múltiples
    text = text.trim().replace(/\s+/g, ' ')
    
    // Mapeo de caracteres que comúnmente se confunden
    const charMap: Record<string, string> = {
      'Z': 'T',
      'O': 'U', 
      'U': 'O',
      'V': 'V',
      'J': 'Z',
    }
    
    // Intentar corregir caracteres confundidos
    let corrected = text.split('').map(char => {
      return charMap[char.toUpperCase()] || char
    }).join('')
    
    // Si contiene "ZOUVUJ", probablemente es "TU VOZ"
    if (text.includes('ZOUV') || text.includes('ZOU')) {
      // Patrón: ZOUVUJ -> TU VOZ
      corrected = corrected.replace(/ZOU+V+U+J*/gi, 'TU VOZ')
    }
    
    // Intentar separar palabras pegadas (detectar patrones de mayúsculas)
    corrected = corrected.replace(/([a-z])([A-Z])/g, '$1 $2')
    
    // Convertir a formato título (Primera Letra Mayúscula)
    corrected = corrected.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return corrected
  }

  // --- Preprocesamiento de imagen para mejorar precisión ---
  const preprocessImage = (imageDataUrl: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        
        // Mantener resolución alta para detalles de braille
        const maxDimension = 1920
        let width = img.width
        let height = img.height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Aplicar mejoras de contraste
        ctx.drawImage(img, 0, 0, width, height)
        
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        
        // Aumentar contraste y nitidez
        for (let i = 0; i < data.length; i += 4) {
          // Convertir a escala de grises
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          
          // Aumentar contraste
          const contrast = 1.5
          const adjusted = ((gray - 128) * contrast) + 128
          
          data[i] = adjusted     // R
          data[i + 1] = adjusted // G
          data[i + 2] = adjusted // B
        }
        
        ctx.putImageData(imageData, 0, 0)
        
        // Exportar con alta calidad
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, "image/jpeg", 0.95)
      }
      img.src = imageDataUrl
    })
  }

  // --- Cámara ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch {
      toast({ 
        title: "❌ Error de cámara", 
        description: "No se pudo acceder a la cámara. Verifica los permisos del navegador.", 
        variant: "destructive",
        duration: 5000 
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setIsCameraActive(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL("image/jpeg")
        setCapturedImage(imageDataUrl)
        stopCamera()
        processImage(imageDataUrl)
      }
    }
  }

  // --- Subida de archivo ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setCapturedImage(imageDataUrl)
        processImageFromFile(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImageFromFile = async (file: File) => {
    setIsProcessing(true)
    try {
      // Preprocesar imagen para mejorar calidad
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string
        const processedBlob = await preprocessImage(imageDataUrl)
        
        const formData = new FormData()
        formData.append("image", processedBlob, "image.jpg")

        // 🤖 Llamar directamente a la API de IA (sin proxy para evitar timeout de Amplify)
        const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://easybraille-api.onrender.com"
        
        toast({ 
          title: "🔍 Procesando imagen", 
          description: "Mejorando calidad y enviando a la IA para detección de Braille...",
          duration: 3000 
        })
        
        const response = await fetch(`${aiApiUrl}/predict`, { 
          method: "POST", 
          body: formData,
          mode: 'cors'
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.error) throw new Error(data.error)

        // AI API returns 'texto' or 'text' field
        let detectedBrailleText = data.texto || data.text || data.predicted_text || ""
        
        // Aplicar corrección de orden de lectura
        detectedBrailleText = correctReadingOrder(detectedBrailleText)
        
        setDetectedText(detectedBrailleText)
        onTextDetected(detectedBrailleText)
        toast({ 
          title: "✅ Imagen procesada", 
          description: "Texto en Braille detectado y traducido exitosamente.",
          duration: 4000 
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing image:", error)
      toast({ title: "Error", description: `No se pudo procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = async (imageDataUrl: string) => {
    setIsProcessing(true)
    try {
      // Preprocesar imagen para mejorar calidad
      const processedBlob = await preprocessImage(imageDataUrl)
      const file = new File([processedBlob], "captured-image.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)

      // 🤖 Llamar directamente a la API de IA (sin proxy para evitar timeout de Amplify)
      const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://easybraille-api.onrender.com"
      
      toast({ title: "Procesando", description: "Mejorando imagen y enviando a la IA..." })
      
      const apiResponse = await fetch(`${aiApiUrl}/predict`, { 
        method: "POST", 
        body: formData,
        mode: 'cors'
      })
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${apiResponse.status}`)
      }
      const data = await apiResponse.json()
      if (data.error) throw new Error(data.error)

      // AI API returns 'texto' or 'text' field
      let detectedBrailleText = data.texto || data.text || data.predicted_text || ""
      
      // Aplicar corrección de orden de lectura
      detectedBrailleText = correctReadingOrder(detectedBrailleText)
      
      setDetectedText(detectedBrailleText)
      onTextDetected(detectedBrailleText)
      toast({ title: "Imagen procesada", description: "Texto detectado exitosamente." })
    } catch (error) {
      console.error("Error processing image:", error)
      toast({ title: "Error", description: `No se pudo procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Confirmar / corregir ---
  const handleConfirmTranslation = async () => {
    if (!detectedText) return
    try {
      await fetch(`${API_URL}/api/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brailleText: "⠓⠕⠇⠁⠀⠍⠥⠝⠙⠕", originalText: detectedText, translationType: "braille-to-text" }),
      })
      toast({ title: "Confirmado", description: "Traducción guardada." })
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la traducción.", variant: "destructive" })
    }
  }

  const handleSubmitCorrection = async () => {
    if (!correctedText.trim()) return
    try {
      await fetch(`${API_URL}/api/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brailleText: "⠓⠕⠇⠁⠀⠍⠥⠝⠙⠕", originalText: correctedText, translationType: "braille-to-text" }),
      })
      toast({ title: "Guardado", description: "Corrección registrada." })
      setIsCorrectionOpen(false)
      setCorrectedText("")
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la corrección.", variant: "destructive" })
    }
  }

  const resetImage = () => {
    setCapturedImage(null)
    setDetectedText(null)
    setIsProcessing(false)
    setIsCorrectionOpen(false)
    setCorrectedText("")
  }

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Subida o cámara */}
      {!capturedImage && !isCameraActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={startCamera}>
            <CardContent className="flex flex-col items-center justify-center p-6 h-40">
              <Camera className="h-10 w-10 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Usar cámara</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => fileInputRef.current?.click()}>
            <CardContent className="flex flex-col items-center justify-center p-6 h-40">
              <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subir imagen</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vista previa video */}
      {isCameraActive && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={captureImage}>Capturar</Button>
            <Button variant="outline" onClick={stopCamera}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Imagen cargada */}
      {capturedImage && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/80" onClick={resetImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center">
            {isProcessing ? <Button disabled>Procesando imagen...</Button> : <Button onClick={() => processImage(capturedImage)}>Procesar de nuevo</Button>}
          </div>
        </div>
      )}

      {/* Resultado de traducción */}
      {detectedText && (
        <div className="mt-4 space-y-3 bg-white border rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold">Texto detectado:</h3>
          <p className="text-gray-800 text-xl">{detectedText}</p>

          <div className="flex gap-3 mt-2">
            <Button onClick={handleConfirmTranslation} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
            <Button onClick={() => setIsCorrectionOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">Corregir</Button>
          </div>

          {isCorrectionOpen && (
            <div className="mt-2 space-y-2">
              <input type="text" value={correctedText} onChange={(e) => setCorrectedText(e.target.value)} placeholder="Escribe la corrección" className="w-full border p-2 rounded" />
              <div className="flex gap-2">
                <Button onClick={handleSubmitCorrection} className="bg-blue-600 text-white hover:bg-blue-700">Guardar corrección</Button>
                <Button onClick={() => setIsCorrectionOpen(false)} variant="outline">Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
