import jsPDF from "jspdf"

interface TranslationData {
  originalText: string
  translatedText: string
  translationType: "TEXT_TO_BRAILLE" | "BRAILLE_TO_TEXT"
  timestamp?: Date
  language?: string
}

// Función auxiliar para limpiar texto
function cleanText(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Función para agregar logo al PDF
async function addLogo(doc: jsPDF, x: number, y: number, size: number): Promise<void> {
  try {
    // Intentar cargar el logo desde la carpeta public
    const img = new Image()
    img.src = '/images/easybraillenegro.png' // Logo negro existente
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        doc.addImage(img, 'PNG', x, y, size, size)
        resolve(true)
      }
      img.onerror = () => resolve(false) // Si falla, continuar sin logo
    })
  } catch (error) {
    console.log('No se pudo cargar el logo:', error)
  }
}

// Función para agregar marca de agua (sin usar métodos no soportados)
async function addWatermark(doc: jsPDF, x: number, y: number, size: number): Promise<void> {
  try {
    const img = new Image()
    img.src = '/images/easybraillenegro.png' // Usar el mismo logo con opacidad baja
    
    await new Promise((resolve) => {
      img.onload = () => {
        // jsPDF no soporta GState directamente, usaremos una imagen con menor opacidad
        // La marca de agua se verá más tenue por el tamaño y posición
        doc.addImage(img, 'PNG', x, y, size, size)
        resolve(true)
      }
      img.onerror = () => resolve(false)
    })
  } catch (error) {
    console.log('No se pudo cargar marca de agua:', error)
  }
}

export async function generateTranslationPDF(translation: TranslationData): Promise<void> {
  const doc = new jsPDF()

  // Configuración del documento (formato A4: 595x842 pts)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14 // ~40 px en Android
  const padding = 3.5 // ~10 px
  const contentWidth = pageWidth - (margin * 2) - (padding * 2)
  
  // Limpiar textos
  const cleanSpanishText = cleanText(
    translation.translationType === "TEXT_TO_BRAILLE" 
      ? translation.originalText 
      : translation.translatedText
  ) || "(Vacío)"
  
  const cleanBrailleText = cleanText(
    translation.translationType === "TEXT_TO_BRAILLE" 
      ? translation.translatedText 
      : translation.originalText
  ) || "(Vacío)"
  
  // Revertir texto Braille (como en Android)
  const reversedBrailleText = cleanBrailleText.split('').reverse().join('')

  let currentBrailleIndex = 0
  let currentSpanishIndex = 0
  let pageNumber = 1

  // Procesar múltiples páginas
  while (currentBrailleIndex < reversedBrailleText.length || currentSpanishIndex < cleanSpanishText.length) {
    if (pageNumber > 1) {
      doc.addPage()
    }

    let currentY = margin

    // ===== ENCABEZADO: Logo y Título =====
    const logoSize = 21 // ~60px
    
    // Logo superior derecho
    await addLogo(doc, pageWidth - margin - logoSize, margin, logoSize)
    
    // Título
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Tabla de Traducción en Braille", margin, currentY + (logoSize / 2))
    currentY += logoSize + 7
    
    // ===== SECCIÓN BRAILLE (70% superior) =====
    const brailleSectionTop = currentY
    const spanishSectionTop = pageHeight * 0.7
    const brailleBoxBottom = spanishSectionTop - 7
    const brailleBoxHeight = brailleBoxBottom - brailleSectionTop
    const spanishBoxBottom = pageHeight - margin
    
    // Marca de agua en sección Braille
    const watermarkSize = 106 // ~300px
    const watermarkX = (pageWidth - watermarkSize) / 2
    const watermarkY = brailleSectionTop + ((brailleBoxHeight - watermarkSize) / 2)
    await addWatermark(doc, watermarkX, watermarkY, watermarkSize)
    
    // Borde azul para sección Braille
    doc.setDrawColor(0, 0, 255)
    doc.setLineWidth(1)
    doc.rect(margin, brailleSectionTop, pageWidth - (margin * 2), brailleBoxHeight)
    
    // Instrucciones
    currentY = brailleSectionTop + padding
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const instructionText = "Instrucción: Perfora los puntos. Al terminar, gira la hoja para leer en Braille."
    const instructionLines = doc.splitTextToSize(instructionText, contentWidth)
    instructionLines.forEach((line: string, index: number) => {
      doc.text(line, margin + padding, currentY + (index * 6))
    })
    currentY += (instructionLines.length * 6) + padding
    
    // Texto Braille
    const availableBrailleHeight = brailleBoxBottom - currentY - padding
    const remainingBraille = reversedBrailleText.substring(currentBrailleIndex)
    
    if (remainingBraille.length > 0) {
      doc.setFontSize(20)
      doc.setFont("courier", "normal") // Fuente monoespaciada
      doc.setTextColor(0, 0, 0)
      
      const brailleLines = doc.splitTextToSize(remainingBraille, contentWidth)
      const lineHeight = 7
      const maxLines = Math.floor(availableBrailleHeight / lineHeight)
      const linesToDraw = brailleLines.slice(0, maxLines)
      
      linesToDraw.forEach((line: string, index: number) => {
        doc.text(line, margin + padding, currentY + (index * lineHeight))
        currentBrailleIndex += line.length
      })
    }
    
    // ===== SECCIÓN ESPAÑOL (30% inferior) =====
    currentY = spanishSectionTop + padding
    
    // Borde azul para sección Español
    doc.setDrawColor(0, 0, 255)
    doc.setLineWidth(1)
    doc.rect(margin, spanishSectionTop, pageWidth - (margin * 2), spanishBoxBottom - spanishSectionTop)
    
    // Título de sección
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    const titleText = pageNumber === 1 ? "Texto original:" : "Texto original (Continuación...)"
    doc.text(titleText, margin + padding, currentY)
    currentY += 7
    
    // Texto en Español
    const availableSpanishHeight = spanishBoxBottom - currentY - padding
    const remainingSpanish = cleanSpanishText.substring(currentSpanishIndex)
    
    if (remainingSpanish.length > 0) {
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(64, 64, 64) // Gris oscuro
      
      const spanishLines = doc.splitTextToSize(remainingSpanish, contentWidth)
      const lineHeight = 5
      const maxLines = Math.floor(availableSpanishHeight / lineHeight)
      const linesToDraw = spanishLines.slice(0, maxLines)
      
      linesToDraw.forEach((line: string, index: number) => {
        doc.text(line, margin + padding, currentY + (index * lineHeight))
        currentSpanishIndex += line.length
      })
    }
    
    // Número de página
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(64, 64, 64)
    doc.text(`Pág. ${pageNumber}`, pageWidth - margin - 18, pageHeight - margin + 3)
    
    pageNumber++
  }

  // Generar nombre del archivo con timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  const filename = `BrailleTemplate_${timestamp}.pdf`

  // Descargar el PDF
  doc.save(filename)
}

export function generateMultipleTranslationsPDF(translations: TranslationData[]): void {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const lineHeight = 8
  let currentY = margin

  // Encabezado principal
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("EasyBraille - Historial de Traducciones", pageWidth / 2, currentY, { align: "center" })
  currentY += 20

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Total de traducciones: ${translations.length}`, margin, currentY)
  currentY += 10
  doc.text(`Generado el: ${new Date().toLocaleString("es-ES")}`, margin, currentY)
  currentY += 20

  translations.forEach((translation, index) => {
    // Verificar si necesitamos una nueva página
    if (currentY > pageHeight - 100) {
      doc.addPage()
      currentY = margin
    }

    // Número de traducción
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`Traducción ${index + 1}`, margin, currentY)
    currentY += 15

    // Información de la traducción
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const translationTypeText =
      translation.translationType === "TEXT_TO_BRAILLE" ? "Español → Braille" : "Braille → Español"

    doc.text(`Tipo: ${translationTypeText}`, margin, currentY)

    if (translation.timestamp) {
      const dateStr = translation.timestamp.toLocaleDateString("es-ES")
      doc.text(`Fecha: ${dateStr}`, margin + 80, currentY)
    }

    currentY += 12

    // Texto original (truncado si es muy largo)
    doc.setFont("helvetica", "bold")
    doc.text("Original:", margin, currentY)
    currentY += 8

    doc.setFont("helvetica", "normal")
    const originalPreview =
      translation.originalText.length > 100
        ? translation.originalText.substring(0, 100) + "..."
        : translation.originalText

    const originalLines = doc.splitTextToSize(originalPreview, pageWidth - 2 * margin)
    originalLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, margin + 5, currentY)
      currentY += lineHeight
    })

    currentY += 5

    // Texto traducido (truncado si es muy largo)
    doc.setFont("helvetica", "bold")
    doc.text("Traducido:", margin, currentY)
    currentY += 8

    doc.setFont("helvetica", "normal")
    const translatedPreview =
      translation.translatedText.length > 100
        ? translation.translatedText.substring(0, 100) + "..."
        : translation.translatedText

    const translatedLines = doc.splitTextToSize(translatedPreview, pageWidth - 2 * margin)
    translatedLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, margin + 5, currentY)
      currentY += lineHeight
    })

    // Línea separadora
    currentY += 10
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 15
  })

  // Pie de página en la última página
  const footerY = pageHeight - 20
  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(128, 128, 128)
  doc.text("Generado por EasyBraille - Traductor de Braille Accesible", pageWidth / 2, footerY, { align: "center" })

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `historial-traducciones-${timestamp}.pdf`

  // Descargar el PDF
  doc.save(filename)
}
