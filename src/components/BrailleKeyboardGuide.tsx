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
  Calculator,
  Globe,
  Settings,
} from "lucide-react"

export function BrailleKeyboardGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Guía del Teclado Braille Arduino Mejorado
        </CardTitle>
        <CardDescription>
          Teclado Braille con funciones de voz, matemáticas y navegación web
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conexión */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Usb className="h-4 w-4" />
            Conexión
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Conecta tu Arduino Micro Pro a un puerto USB</li>
            <li>El sistema lo reconoce como teclado HID</li>
            <li>No requiere software adicional</li>
          </ol>
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
                <li>Pin 8: Página web</li>
                <li>Pin 10: Backspace</li>
                <li>Pin 16: Espacio</li>
                <li>Pin 14-15: Botones de voz</li>
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
            <li><strong>Botones de voz (Pin 14/15):</strong> Activan lectura de texto</li>
            <li>Presiona para escuchar lo escrito o traducido</li>
          </ul>
        </section>

        {/* Modo Matemático */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Modo Matemático
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Activar:</strong> ⠼ (puntos 3,4,5,6)</li>
            <li><strong>Números:</strong> Letras a-j representan 1-0</li>
            <li><strong>Operaciones:</strong> + − × ÷ =</li>
            <li><strong>Desactivar:</strong> Botón de espacio</li>
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
            <li>Acceso directo sin escribir la URL</li>
          </ul>
        </section>

        {/* Cómo funciona */}
        <section className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cómo funciona
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Debounce de 30ms para evitar pulsaciones múltiples</li>
            <li>Detección simultánea de combinaciones Braille</li>
            <li>Mapeo completo del alfabeto español</li>
            <li>Soporte para caracteres especiales y operaciones</li>
            <li>Funciona como teclado HID estándar</li>
          </ul>
        </section>

        {/* Características Avanzadas */}
        <section className="bg-muted p-3 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Características Avanzadas:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Sistema anti-rebote para mayor precisión</li>
                <li>Múltiples modos de entrada</li>
                <li>Funciones de accesibilidad integradas</li>
                <li>Compatibilidad con lectores de pantalla</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Mapeo de Operaciones Matemáticas */}
        <section className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <Keyboard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600">Mapeo de Operaciones Matemáticas:</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <p><strong>+ (Suma):</strong> ⠖ (puntos 2,3,5)</p>
                  <p><strong>− (Resta):</strong> ⠤ (puntos 3,6)</p>
                  <p><strong>× (Multiplicar):</strong> ⠦ (puntos 2,3,6)</p>
                </div>
                <div>
                  <p><strong>÷ (Dividir):</strong> ⠌ (puntos 3,4)</p>
                  <p><strong>= (Igual):</strong> ⠿ (puntos 1,2,3,4,5,6)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
