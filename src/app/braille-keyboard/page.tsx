"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { BrailleKeyboard } from "@/components/BrailleKeyboard"
import { BrailleKeyboardGuide } from "@/components/BrailleKeyboardGuide"
import { Keyboard, Code, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BrailleKeyboardPage() {
  const [inputText, setInputText] = useState("")

  const handleTextInput = (text: string) => {
    setInputText((prev) => prev + text)
  }

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
              <TabsTrigger value="keyboard">
                <Keyboard className="mr-2 h-4 w-4" />
                Teclado
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="mr-2 h-4 w-4" />
                Código
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="keyboard">
              <Card>
                <CardHeader>
                  <CardTitle>Prueba tu Teclado Braille</CardTitle>
                  <CardDescription>
                    Conecta tu teclado Arduino y comienza a escribir para probar su funcionamiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BrailleKeyboard onTextInput={handleTextInput} />

                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">Texto ingresado</label>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[150px] font-mono"
                      placeholder="El texto del teclado aparecerá aquí..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setInputText("")}>
                      Limpiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Código Arduino</CardTitle>
                  <CardDescription>
                    Código fuente para programar tu Arduino Micro Pro como teclado Braille
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
                    <pre className="text-xs">
                      {`#include <Keyboard.h>

// Configuración de pines
const int key1 = 3;   // Punto 1
const int key2 = 4;   // Punto 2
const int key3 = 2;   // Punto 3
const int key4 = 7;   // Punto 4
const int key5 = 6;   // Punto 5
const int key6 = 5;   // Punto 6
const int key7 = 8;   // Botón especial
const int key8 = 10;  // Backspace
const int key9 = 16;  // Espacio

void setup() {
  // Configurar pines como entradas con resistencias PULLUP
  pinMode(key1, INPUT_PULLUP);
  pinMode(key2, INPUT_PULLUP);
  pinMode(key3, INPUT_PULLUP);
  pinMode(key4, INPUT_PULLUP);
  pinMode(key5, INPUT_PULLUP);
  pinMode(key6, INPUT_PULLUP);
  pinMode(key7, INPUT_PULLUP);
  pinMode(key8, INPUT_PULLUP);
  pinMode(key9, INPUT_PULLUP);

  Serial.begin(9600);
  Keyboard.begin();
  Serial.println("Iniciando teclado Braille...");
}

void loop() {
  // Primero verificar botones especiales
  if (digitalRead(key7) == LOW) {
    openPage();
    return;
  }
  
  if (digitalRead(key8) == LOW) {
    deleteCharacter();
    return;
  }
  
  if (digitalRead(key9) == LOW) {
    sendSpace();
    return;
  }

  // Luego procesar combinaciones Braille
  int brailleCode = readBrailleCode();
  if (brailleCode != 0) {
    writeBrailleCharacter(brailleCode);
    // Esperar a que se suelten todas las teclas
    while (readBrailleCode() != 0) {
      delay(10);
    }
  }
  
  delay(50); // Pequeña pausa para evitar rebotes
}

// Función para abrir Opera GX y cargar ChatGPT
void openPage() {
  Keyboard.press(KEY_RIGHT_GUI); // Presionar tecla Windows
  Keyboard.releaseAll();
  delay(200);

  Keyboard.print("chatgpt");
  delay(100);
  Keyboard.print(".com");
  delay(500);
  
  Keyboard.press(KEY_RETURN);
  Keyboard.releaseAll();

  // Esperar a que el botón se suelte
  while (digitalRead(key7) == LOW) {
    delay(10);
  }
}

// Función para eliminar caracteres (Backspace)
void deleteCharacter() {
  delay(50); // Debounce
  if (digitalRead(key8) == LOW) {
    Keyboard.press(KEY_BACKSPACE);
    Keyboard.releaseAll();
    delay(150);

    // Esperar a que el botón se suelte
    while (digitalRead(key8) == LOW) {
      delay(10);
    }
  }
}

// Función para enviar la tecla Espacio
void sendSpace() {
  delay(50); // Debounce
  if (digitalRead(key9) == LOW) {
    Keyboard.press(' ');
    Keyboard.releaseAll();
    delay(150);

    // Esperar a que el botón se suelte
    while (digitalRead(key9) == LOW) {
      delay(10);
    }
  }
}

// Función para leer el código Braille
int readBrailleCode() {
  int code = 0;

  if (digitalRead(key1) == LOW) code |= 0b100000;  // Punto 1 (arriba izquierda)
  if (digitalRead(key2) == LOW) code |= 0b010000;  // Punto 2 (arriba derecha)
  if (digitalRead(key4) == LOW) code |= 0b001000;  // Punto 3 (medio izquierda)
  if (digitalRead(key3) == LOW) code |= 0b000100;  // Punto 4 (medio derecha)
  if (digitalRead(key6) == LOW) code |= 0b000010;  // Punto 5 (abajo izquierda)
  if (digitalRead(key5) == LOW) code |= 0b000001;  // Punto 6 (abajo derecha)

  return code;
}

// Función para escribir la letra correspondiente al código Braille
void writeBrailleCharacter(int code) {
  char letter = getBrailleCharacter(code);
  Serial.print("Letra detectada: ");
  Serial.println(letter);
  
  // Enviar solo la letra (sin Ctrl+Alt)
  Keyboard.press(letter);
  delay(20);
  Keyboard.releaseAll();
}

// Función para obtener la letra correspondiente al código Braille
char getBrailleCharacter(int code) {
  switch (code) {
    case 0b100000: return 'a';  
    case 0b110000: return 'b';  
    case 0b100100: return 'c';  
    case 0b100110: return 'd';  
    case 0b100010: return 'e';  
    case 0b110100: return 'f';  
    case 0b110110: return 'g';  
    case 0b110010: return 'h';  
    case 0b010100: return 'i';  
    case 0b010110: return 'j';  
    case 0b101000: return 'k';  
    case 0b111000: return 'l';  
    case 0b101100: return 'm';  
    case 0b101110: return 'n';  
    case 0b101010: return 'o';  
    case 0b111100: return 'p';  
    case 0b111110: return 'q';  
    case 0b111010: return 'r';  
    case 0b011100: return 's';  
    case 0b011110: return 't';  
    case 0b101001: return 'u';  
    case 0b111001: return 'v';  
    case 0b010111: return 'w';  
    case 0b101101: return 'x';  
    case 0b101111: return 'y';  
    case 0b101011: return 'z';  
    default: return '?';  // Carácter no reconocido
  }
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Teclado</CardTitle>
                  <CardDescription>Personaliza la configuración de tu teclado Braille Arduino</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Mapeo de teclas</h3>
                    <p className="text-sm text-muted-foreground">
                      El teclado Braille Arduino envía letras individuales. Puedes personalizar este comportamiento
                      modificando el código Arduino.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Sensibilidad</h3>
                    <p className="text-sm text-muted-foreground">
                      Si experimentas problemas con la sensibilidad de las teclas, puedes ajustar el valor de debounce
                      (actualmente 50ms) en el código Arduino.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Funciones especiales</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes personalizar las funciones de los botones especiales (botón 7, 8 y 9) modificando las
                      funciones openPage(), deleteCharacter() y sendSpace() en el código Arduino.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <BrailleKeyboardGuide />
        </div>
      </div>
    </div>
  )
}
