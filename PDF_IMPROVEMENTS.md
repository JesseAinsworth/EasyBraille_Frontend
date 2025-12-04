# Mejoras en la Generación de PDF

## Adaptación desde Android a Web

Se ha adaptado el código de generación de PDF de la aplicación móvil Android a la versión web de EasyBraille.

## Características Implementadas

### 1. **Logo y Marca de Agua**
- Logo del proyecto en la esquina superior derecha
- Marca de agua centrada en la sección de Braille
- Uso de imágenes existentes: `/images/easybraillenegro.png`

### 2. **Diseño Profesional**
- Bordes azules para las secciones (como en Android)
- Distribución 70/30 (Braille arriba, Español abajo)
- Márgenes y padding consistentes
- Fuente monoespaciada (Courier) para Braille

### 3. **Soporte Multi-Página**
- El PDF se extiende automáticamente en múltiples páginas si el texto es largo
- Numeración de páginas en la esquina inferior derecha
- Continuación automática de texto Braille y Español

### 4. **Instrucciones Claras**
- Instrucciones de perforación en cada página
- Indicación de giro de hoja para lectura en relieve
- Título diferenciado en páginas de continuación

### 5. **Formato Texto Braille Invertido**
- El texto Braille se invierte automáticamente (como en Android)
- Facilita la perforación correcta del papel
- Al girar la hoja, el texto se lee correctamente

## Diferencias con Android

| Característica | Android | Web |
|---------------|---------|-----|
| **Opacidad de Marca de Agua** | GState con opacity 0.1 | Imagen normal (jsPDF no soporta GState) |
| **Carga de Imágenes** | BitmapFactory | Image() con Promise |
| **Formato de Fecha** | SimpleDateFormat | ISO String |
| **Almacenamiento** | FileProvider + External Storage | Descarga directa del navegador |
| **Fuente Braille** | Typeface.MONOSPACE | Courier (monoespaciada) |

## Uso

```typescript
import { generateTranslationPDF } from "@/lib/generatorPdf"

// Async/await necesario
await generateTranslationPDF({
  originalText: "texto en español",
  translatedText: "⠞⠑⠭⠞⠕",
  translationType: "TEXT_TO_BRAILLE",
  timestamp: new Date(),
  language: "es"
})
```

## Archivos Modificados

1. **`src/lib/generatorPdf.ts`**
   - Refactorización completa basada en código Android
   - Funciones async para carga de imágenes
   - Soporte multi-página automático
   
2. **`src/app/translator/page.tsx`**
   - Función `handleDownloadPDF` ahora es async
   - Usa await para llamar a generateTranslationPDF

## Archivos de Imagen Necesarios

- ✅ `/public/images/easybraillenegro.png` - Logo principal (ya existe)
- ✅ El mismo logo se usa como marca de agua

## Mejoras Futuras

1. **Opacidad Real de Marca de Agua**: Investigar librería jsPDF-autotable o canvas pre-renderizado
2. **Puntos Perforables**: Agregar círculos para guiar la perforación (como en versión anterior)
3. **QR Code**: Agregar código QR con enlace a EasyBraille
4. **Exportar Lista**: Permitir exportar múltiples traducciones del historial en un solo PDF

## Comparación Visual

### Layout Android → Web

```
┌─────────────────────────────────────┐
│ Título              [Logo] 60px     │ ← Encabezado
├─────────────────────────────────────┤
│                                     │
│  Instrucciones: Perfora...          │
│                                     │
│  ⠞⠑⠭⠞⠕ ⠑⠝ ⠃⠗⠁⠊⠇⠇⠑             │ ← 70%
│  (Texto invertido)                  │   Braille
│                                     │
│      [MARCA DE AGUA]                │
│                                     │
├─────────────────────────────────────┤
│ Texto original:                     │
│                                     │ ← 30%
│ texto en español...                 │   Español
│                                     │
│                           Pág. 1    │
└─────────────────────────────────────┘
```

## Changelog

- ✅ Implementada función `cleanText()` para normalizar espacios
- ✅ Implementada función `addLogo()` con carga async
- ✅ Implementada función `addWatermark()` 
- ✅ Layout 70/30 con bordes azules
- ✅ Soporte multi-página automático
- ✅ Texto Braille invertido automáticamente
- ✅ Numeración de páginas
- ✅ Timestamp en nombre de archivo
- ✅ Función principal ahora es async

## Testing

Para probar:
1. Ir a la pestaña "Teclado Braille" o "Texto"
2. Traducir cualquier texto
3. Hacer clic en "Descargar PDF"
4. Verificar que el PDF descargado tenga:
   - Logo en la esquina
   - Bordes azules
   - Texto Braille invertido
   - Sección de español
   - Número de página

## Notas Técnicas

- **Promesas**: Las funciones de imagen usan Promises para esperar la carga
- **Try-Catch**: Manejo robusto de errores si las imágenes no cargan
- **Async/Await**: La función principal es async para soportar carga de imágenes
- **Formato A4**: Tamaño estándar 595x842 puntos
- **Coordenadas**: Sistema de coordenadas jsPDF (origen arriba-izquierda)
