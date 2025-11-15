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
      toast({ title: "Error de cámara", description: "No se pudo acceder a la cámara.", variant: "destructive" })
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
      const formData = new FormData()
      formData.append("image", file)

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const response = await fetch(`${BACKEND_URL}/api/braille-image`, { method: "POST", body: formData })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setDetectedText(data.texto)
      onTextDetected(data.texto)
      toast({ title: "Imagen procesada", description: "Texto detectado exitosamente." })
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
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
      const apiResponse = await fetch(`${BACKEND_URL}/api/braille-image`, { method: "POST", body: formData })
      if (!apiResponse.ok) throw new Error(`HTTP error! status: ${apiResponse.status}`)
      const data = await apiResponse.json()
      if (data.error) throw new Error(data.error)

      setDetectedText(data.texto)
      onTextDetected(data.texto)
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
