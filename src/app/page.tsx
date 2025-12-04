import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BlindsIcon as Braille, Globe, Users, Smartphone, Download } from "lucide-react"
import { LogoSection } from "@/components/LogoSection"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <section className="flex-1 py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <LogoSection
              size="xlarge"
              showText={false}
              src="/images/logo22.png"
              alt="EasyBraille Center Logo"
              srcSet="/images/logo22.png 1x, /images/logo22@2x.png 2x"
            />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Traductor de Braille a Español y viceversa
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Traduce fácilmente entre Braille y español con nuestra herramienta intuitiva. Perfecta para estudiantes,
                educadores y personas con discapacidad visual.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/translator">
                <Button size="lg" className="gap-2">
                  Comenzar a traducir <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Crear cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Braille className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Traducción Precisa</h3>
                <p className="text-muted-foreground">
                  Nuestro algoritmo avanzado garantiza traducciones precisas entre Braille y español.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Accesible en Cualquier Lugar</h3>
                <p className="text-muted-foreground">
                  Accede a nuestra herramienta desde cualquier dispositivo, en cualquier momento.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Para Todos los Usuarios</h3>
                <p className="text-muted-foreground">
                  Diseñado para ser utilizado por personas con y sin discapacidad visual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de descarga de la aplicación móvil */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-muted to-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Smartphone className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Descarga nuestra App Móvil
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Lleva EasyBraille contigo a donde vayas. Nuestra aplicación móvil está disponible para Android
                con todas las funcionalidades del traductor en la palma de tu mano.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <a 
                href="https://github.com/JesseAinsworth/EasyBraille_App/releases" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="h-5 w-5" />
                  Descargar para Android
                </Button>
              </a>
              <p className="text-sm text-muted-foreground">
                Versión 1.0 - Compatible con Android 8.0+
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 max-w-4xl mt-8">
              <div className="flex flex-col items-center space-y-2 text-center p-4 bg-card rounded-lg border">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Braille className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold">Traductor Offline</h4>
                <p className="text-sm text-muted-foreground">
                  Traduce sin conexión a internet
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center p-4 bg-card rounded-lg border">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold">Interfaz Optimizada</h4>
                <p className="text-sm text-muted-foreground">
                  Diseñada para uso móvil
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center p-4 bg-card rounded-lg border">
                <div className="bg-green-100 p-3 rounded-full">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold">Descarga Gratuita</h4>
                <p className="text-sm text-muted-foreground">
                  100% gratis, sin anuncios
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
