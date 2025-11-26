import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Keyboard,
  Usb,
  Braces,
  AlertCircle,
  Volume2,
  Globe,
  Settings,
} from "lucide-react"

export function BrailleKeyboardGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Guía del Teclado Braille Arduino
        </CardTitle>
        <CardDescription>
          Teclado Braille con funciones de voz y navegación web
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Conexión */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Usb className="h-4 w-4" />
            Conexión
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Conecta tu Arduino Micro Pro a un puerto USB</li>
            <li>El sistema lo reconoce como teclado HID</li>
            <li>No requiere software adicional</li>
          </ul>
        </section>

        {/* Configuración de Pines */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Braces className="h-4 w-4" />
            Configuración de Pines
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="font-medium">Puntos Braille:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Pin 3: Punto 1</li>
                <li>Pin 4: Punto 2</li>
                <li>Pin 2: Punto 3</li>
                <li>Pin 7: Punto 4</li>
                <li>Pin 6: Punto 5</li>
                <li>Pin 5: Punto 6</li>
              </ul>
            </div>

            <div>
              <p className="font-medium">Funciones Especiales:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Pin 8: Abrir página web</li>
                <li>Pin 10: Backspace</li>
                <li>Pin 16: Espacio</li>
                <li>Pin 14–15: Botones de voz</li>
              </ul>
            </div>

          </div>
        </section>

        {/* Funciones de Voz */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Funciones de Voz
          </h3>

          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Botones de voz (A0 y A1):</strong> Activan la lectura del texto</li>
            <li>Envían el comando “LEER” a la app</li>
          </ul>
        </section>

        {/* Navegación Web */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Navegación Web
          </h3>

          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Pin 8:</strong> Abre EasyBraille.com automáticamente</li>
            <li>Acceso rápido sin escribir la URL</li>
          </ul>
        </section>

        {/* Cómo funciona */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cómo funciona
          </h3>

          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Anti-rebote de 30ms para evitar doble pulsación</li>
            <li>Detección simultánea de los 6 puntos</li>
            <li>Mapeo completo del alfabeto Braille</li>
            <li>Usa el estándar HID para funcionar como teclado</li>
          </ul>
        </section>

        {/* Características avanzadas */}
        <section className="bg-muted p-3 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Características Avanzadas:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Lectura de voz integrada</li>
                <li>Sistema de detección preciso</li>
                <li>Teclas especiales para accesibilidad</li>
                <li>Compatible con lectores de pantalla</li>
              </ul>
            </div>
          </div>
        </section>

      </CardContent>
    </Card>
  )
}
