"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { BrailleKeyboard } from "@/components/BrailleKeyboard"
import { BrailleKeyboardGuide } from "@/components/BrailleKeyboardGuide"
import { Keyboard, Code, Settings, ArrowLeft, Volume2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function BrailleKeyboardPage() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [translationDirection] = useState<"frombraille">("frombraille")
  const [keyboardConnected, setKeyboardConnected] = useState(false)
  const { toast } = useToast()

  // Mapeo de letras a símbolos Braille (el teclado físico envía letras)
  const letterToBraille: { [key: string]: string } = {
    a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓",
    i: "⠊", j: "⠚", k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏",
    q: "⠟", r: "⠗", s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
    y: "⠽", z: "⠵", " ":" ",
    "1": "⠼⠁", "2": "⠼⠃", "3": "⠼⠉", "4": "⠼⠙", "5": "⠼⠑",
    "6": "⠼⠋", "7": "⠼⠛", "8": "⠼⠓", "9": "⠼⠊", "0": "⠼⠚",
    "+": "⠐⠖", "-": "⠤", "*": "⠐⠦", "/": "⠸⠌", "=": "⠐⠶",
    ".": "⠲", ",": "⠂", "?": "⠦", "!": "⠖", "'": "⠄", '"': "⠐⠄",
  }

  const handleTextInput = (text: string) => {
    // Notificar conexión del teclado la primera vez
    if (!keyboardConnected) {
      setKeyboardConnected(true)
      toast({
        title: "✅ Teclado Braille detectado",
        description: "Tu teclado Arduino está conectado y funcionando correctamente.",
        type: "success",
        duration: 3000
      })
    }
    
    // El componente BrailleKeyboard ya envía símbolos Braille
    // Solo agregamos el texto directamente
    setInputText((prev) => prev + text)
    
    // Para el español, necesitamos convertir de Braille a español
    const spanishMap: { [key: string]: string } = {
      "⠁": "a", "⠃": "b", "⠉": "c", "⠙": "d", "⠑": "e", "⠋": "f", "⠛": "g", "⠓": "h",
      "⠊": "i", "⠚": "j", "⠅": "k", "⠇": "l", "⠍": "m", "⠝": "n", "⠕": "o", "⠏": "p",
      "⠟": "q", "⠗": "r", "⠎": "s", "⠞": "t", "⠥": "u", "⠧": "v", "⠺": "w", "⠭": "x",
      "⠽": "y", "⠵": "z", " ": " ",
      "⠼⠁": "1", "⠼⠃": "2", "⠼⠉": "3", "⠼⠙": "4", "⠼⠑": "5",
      "⠼⠋": "6", "⠼⠛": "7", "⠼⠓": "8", "⠼⠊": "9", "⠼⠚": "0",
      "⠐⠖": "+", "⠤": "-", "⠐⠦": "*", "⠸⠌": "/", "⠐⠶": "=",
      "⠲": ".", "⠂": ",", "⠦": "?", "⠖": "!", "⠄": "'", "⠐⠄": '"',
    }
    
    const spanishChar = spanishMap[text] || text
    setOutputText((prev) => prev + spanishChar)
  }
  
  const handleVoice = () => {
    if (!outputText) {
      toast({
        title: "Sin texto",
        description: "No hay texto en español para leer.",
        type: "warning",
        duration: 3000
      })
      return
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(outputText)
      utterance.lang = "es-ES"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
      
      toast({
        title: "Reproduciendo",
        description: "Leyendo el texto en voz alta.",
        type: "info",
        duration: 3000
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reproducir el texto.",
        type: "error",
        duration: 3000
      })
    }
  }
  
  const handleClear = () => {
    setInputText("")
    setOutputText("")
    toast({
      title: "Limpiado",
      description: "El texto ha sido eliminado.",
      type: "success",
      duration: 2000
    })
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
                  <CardTitle>Teclado Braille → Español</CardTitle>
                  <CardDescription>
                    Conecta tu teclado Arduino y escribe en Braille. La traducción a español aparecerá automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BrailleKeyboard
                    onTextInput={handleTextInput}
                    onBackspace={() => {
                      setInputText((prev) => prev.slice(0, -1))
                      setOutputText((prev) => prev.slice(0, -1))
                    }}
                    onSpace={() => {
                      setInputText((prev) => prev + " ")
                      setOutputText((prev) => prev + " ")
                    }}
                  />

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
                      <label className="text-sm font-medium">Español</label>
                      <Textarea
                        value={outputText}
                        onChange={(e) => setOutputText(e.target.value)}
                        className="min-h-[150px] font-mono"
                        placeholder="braille"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleVoice}
                      disabled={!outputText}
                    >
                      <Volume2 className="mr-2 h-4 w-4" />
                      Leer en voz alta
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClear}
                    >
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
  const int key7 = 8;   // Botón especial (abrir página)
  const int key8 = 10;  // Backspace
  const int key9 = 16;  // Espacio

  const int voiceButton1 = 14; // 🔊 Botón de voz
  const int voiceButton2 = 15; // 🔊 Segundo botón de voz

  bool numeroActivo = false; // Estado del modo número

  // -------------------- Debounce para teclas Braille --------------------
  const int debounceDelay = 30; // ms
  unsigned long lastDebounceTime[6] = {0,0,0,0,0,0};
  bool lastButtonState[6] = {HIGH,HIGH,HIGH,HIGH,HIGH,HIGH};
  bool buttonState[6] = {HIGH,HIGH,HIGH,HIGH,HIGH,HIGH};
  const int braillePins[6] = {key1, key2, key3, key4, key5, key6};

  // --------------------------------------------------------------------
  bool esOperacion(int code) {
    return code == 0b011010 || code == 0b001001 || code == 0b011001 || code == 0b010011 || code == 0b011011;
  }

  void setup() {
    pinMode(key1, INPUT_PULLUP);
    pinMode(key2, INPUT_PULLUP);
    pinMode(key3, INPUT_PULLUP);
    pinMode(key4, INPUT_PULLUP);
    pinMode(key5, INPUT_PULLUP);
    pinMode(key6, INPUT_PULLUP);
    pinMode(key7, INPUT_PULLUP);
    pinMode(key8, INPUT_PULLUP);
    pinMode(key9, INPUT_PULLUP);

    pinMode(voiceButton1, INPUT_PULLUP);
    pinMode(voiceButton2, INPUT_PULLUP);

    Serial.begin(9600);
    Keyboard.begin();

    Serial.println("✅ Teclado Braille con salida de voz listo...");
  }

  void loop() {
    // 🔊 Botones de voz
    if (digitalRead(voiceButton1) == LOW || digitalRead(voiceButton2) == LOW) {
      activarVoz();
      return;
    }

    // Botón especial original (abrir página)
    if (digitalRead(key7) == LOW) {
      openPage();
      return;
    }

    // Backspace
    if (digitalRead(key8) == LOW) {
      deleteCharacter();
      return;
    }

    // Espacio
    if (digitalRead(key9) == LOW) {
      sendSpace();
      return;
    }

    // ------------------ Lectura de teclas Braille con debounce ------------------
    checkBrailleKeys();

    delay(10); // Pequeño delay para no saturar el loop
  }

  // --------------------------------------------------------------------
  // Función de lectura con debounce y detección simultánea
  void checkBrailleKeys() {
    for (int i = 0; i < 6; i++) {
      int reading = digitalRead(braillePins[i]);

      if (reading != lastButtonState[i]) {
        lastDebounceTime[i] = millis();
      }

      if ((millis() - lastDebounceTime[i]) > debounceDelay) {
        if (reading != buttonState[i]) {
          buttonState[i] = reading;
          if (buttonState[i] == LOW) { // Tecla presionada
            processBrailleInput();
          }
        }
      }

      lastButtonState[i] = reading;
    }
  }

  void processBrailleInput() {
    delay(20); // Tiempo para estabilizar todas las teclas
    int brailleCode = readBrailleCode();

    // Activar modo número
    if (brailleCode == 0b001111) {
      numeroActivo = true;
      Serial.println("Modo número ACTIVADO");
      sendUnicodeAltCode(10236); // símbolo Braille ⠼
      while (readBrailleCode() != 0) delay(10);
      return;
    }

    if (brailleCode != 0) {
      writeBrailleCharacter(brailleCode);
      while (readBrailleCode() != 0) delay(10);
    }

    delay(50); // Tiempo para liberar antes de siguiente letra
  }

  // --------------------------------------------------------------------
  // 🔊 Función de voz
  void activarVoz() {
    Serial.println("🗣 LEER");
    Keyboard.print("");
    Keyboard.press(KEY_RETURN);
    Keyboard.releaseAll();
    delay(300);
    while (digitalRead(voiceButton1) == LOW || digitalRead(voiceButton2) == LOW) delay(10);
  }

  // --------------------------------------------------------------------
  void sendUnicodeAltCode(int code) {
    Keyboard.press(KEY_LEFT_ALT);
    delay(100);
    String codigo = String(code);
    for (int i = 0; i < codigo.length(); i++) {
      Keyboard.write(codigo[i]);
      delay(50);
    }
    Keyboard.release(KEY_LEFT_ALT);
    delay(100);
  }

  void openPage() {
    Keyboard.press(KEY_RIGHT_GUI);
    Keyboard.releaseAll();
    delay(200);
    Keyboard.print("https://easybraille.com");
    delay(500);
    Keyboard.press(KEY_RETURN);
    Keyboard.releaseAll();
  }

  void deleteCharacter() {
    delay(50);
    if (digitalRead(key8) == LOW) {
      Keyboard.press(KEY_BACKSPACE);
      Keyboard.releaseAll();
      delay(150);
      while (digitalRead(key8) == LOW) delay(10);
    }
  }

  void sendSpace() {
    delay(50);
    if (digitalRead(key9) == LOW) {
      Keyboard.press(' ');
      Keyboard.releaseAll();
      delay(150);
      numeroActivo = false;
      Serial.println("Modo número DESACTIVADO");
      while (digitalRead(key9) == LOW) delay(10);
    }
  }

  // --------------------------------------------------------------------
  int readBrailleCode() {
    int code = 0;
    if (digitalRead(key1) == LOW) code |= 0b100000;
    if (digitalRead(key2) == LOW) code |= 0b010000;
    if (digitalRead(key4) == LOW) code |= 0b001000;
    if (digitalRead(key3) == LOW) code |= 0b000100;
    if (digitalRead(key6) == LOW) code |= 0b000010;
    if (digitalRead(key5) == LOW) code |= 0b000001;
    return code;
  }

  void writeBrailleCharacter(int code) {
    char character;
    if (numeroActivo) {
      character = getBrailleNumber(code);
    } else if (esOperacion(code)) {
      character = getOperationBraille(code);
    } else {
      character = getBrailleCharacter(code);
    }

    Serial.print("Carácter detectado: ");
    Serial.println(character);

    Keyboard.press(character);
    delay(20);
    Keyboard.releaseAll();
  }

  // --------------------------------------------------------------------
  // Funciones de mapeo Braille
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
      default: return '?';
    }
  }

  char getOperationBraille(int code) {
    switch (code) {
      case 0b011010: return '+';
      case 0b001001: return '-';
      case 0b011001: return '*';
      case 0b010011: return '/';
      case 0b011011: return '=';
      default: return '?';
    }
  }

  char getBrailleNumber(int code) {
    switch (code) {
      case 0b100000: return '1';
      case 0b110000: return '2';
      case 0b100100: return '3';
      case 0b100110: return '4';
      case 0b100010: return '5';
      case 0b110100: return '6';
      case 0b110110: return '7';
      case 0b110010: return '8';
      case 0b010100: return '9';
      case 0b010110: return '0';
      default: return '?';
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
                      El sketch mapea las combinaciones de los seis puntos Braille a letras, números y símbolos. Hay
                      soporte para modo número (activado con el patrón ⠼) y para operadores aritméticos (+ - * / =).
                      Modifica las funciones getBrailleCharacter(), getBrailleNumber() y getOperationBraille() para
                      cambiar el mapeo.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Sensibilidad</h3>
                    <p className="text-sm text-muted-foreground">
                      El código usa debounce con un valor por defecto de 30ms. Si ves lecturas erráticas o múltiples
                      caracteres por pulsación, prueba incrementando <code>debounceDelay</code> en el código Arduino.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Funciones especiales</h3>
                    <p className="text-sm text-muted-foreground">
                      Botón 7 abre la página (openPage), botón 8 es Backspace y 9 es Espacio (que además desactiva
                      el modo número). Hay dos botones de voz (pines 14 y 15) que disparan la acción de "leer".
                      Personaliza openPage(), deleteCharacter(), sendSpace() y activarVoz() según tus necesidades.
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
