import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Keyboard, Usb, Braces, AlertCircle } from "lucide-react"

export function BrailleKeyboardGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Guía del Teclado Braille Arduino
        </CardTitle>
        <CardDescription>
          Aprende a conectar y utilizar tu teclado Braille Arduino con nuestra aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Usb className="h-4 w-4" />
            Conexión
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Conecta tu Arduino Micro Pro a un puerto USB de tu computadora</li>
            <li>Espera a que el sistema reconozca el dispositivo como un teclado HID</li>
            <li>No se requiere ningún software adicional, funciona como un teclado estándar</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Braces className="h-4 w-4" />
            Cómo funciona
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>El teclado envía letras individuales</li>
            <li>Cada combinación de puntos Braille corresponde a una letra específica</li>
            <li>La aplicación detecta automáticamente estas letras</li>
            <li>El botón de espacio envía un espacio normal</li>
            <li>El botón de retroceso envía la tecla Backspace</li>
          </ul>
        </div>

        <div className="bg-muted p-3 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Importante:</p>
              <p>
                Si el teclado no es detectado, asegúrate de que esté correctamente conectado y que no haya conflictos
                con otros dispositivos USB. Puede ser necesario desconectar y volver a conectar el dispositivo.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
