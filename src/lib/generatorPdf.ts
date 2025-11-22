import jsPDF from "jspdf"

interface TranslationData {
  originalText: string
  translatedText: string
  translationType: "TEXT_TO_BRAILLE" | "BRAILLE_TO_TEXT"
  timestamp?: Date
  language?: string
}

export function generateTranslationPDF(translation: TranslationData): void {
  const doc = new jsPDF()

  // Configuración del documento
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let currentY = margin

  // Logo y título (centrado)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("Tabla de Traducción Braille", pageWidth / 2, currentY, { align: "center" })
  currentY += 15

  // Logo de EasyBraille (texto simulado, se podría agregar imagen)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(41, 128, 185) // Color azul para el logo
  doc.text("EasyBraille", pageWidth - margin - 25, currentY - 10)
  doc.setTextColor(0, 0, 0) // Volver a negro
  currentY += 10

  // ===== SECCIÓN 1: TEXTO EN BRAILLE =====
  // Marco azul para el texto en Braille
  doc.setDrawColor(41, 128, 185) // Azul
  doc.setLineWidth(1.5)
  doc.rect(margin, currentY, pageWidth - 2 * margin, 110) // Caja grande

  currentY += 10

  // Instrucciones
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Texto en Braille: Perfora los puntos de este texto. Al terminar, gira la hoja para", margin + 5, currentY)
  currentY += 5
  doc.text("leer el relieve correctamente.", margin + 5, currentY)
  currentY += 15

  // Texto en Braille (fuente grande y monospace)
  const brailleText = translation.translationType === "TEXT_TO_BRAILLE" 
    ? translation.translatedText 
    : translation.originalText

  // jsPDF tiene problemas con Unicode Braille, usar representación de puntos
  const brailleToDots: { [key: string]: string } = {
    "⠁": "(1)", "⠃": "(1,2)", "⠉": "(1,4)", "⠙": "(1,4,5)", "⠑": "(1,5)", 
    "⠋": "(1,2,4)", "⠛": "(1,2,4,5)", "⠓": "(1,2,5)", "⠊": "(2,4)", "⠚": "(2,4,5)",
    "⠅": "(1,3)", "⠇": "(1,2,3)", "⠍": "(1,3,4)", "⠝": "(1,3,4,5)", "⠕": "(1,3,5)",
    "⠏": "(1,2,3,4)", "⠟": "(1,2,3,4,5)", "⠗": "(1,2,3,5)", "⠎": "(2,3,4)", "⠞": "(2,3,4,5)",
    "⠥": "(1,3,6)", "⠧": "(1,2,3,6)", "⠺": "(2,4,5,6)", "⠭": "(1,3,4,6)", 
    "⠽": "(1,3,4,5,6)", "⠵": "(1,3,5,6)", " ": " ",
    "⠲": "(2,5,6)", "⠂": "(2)", "⠦": "(2,3,6)", "⠖": "(2,3,5)",
  }

  // Crear representación con símbolos Braille Y notación de puntos
  doc.setFont("courier", "bold")
  doc.setFontSize(20)
  
  // Dividir texto en líneas
  const maxCharsPerLine = 25
  const lines: string[] = []
  for (let i = 0; i < brailleText.length; i += maxCharsPerLine) {
    lines.push(brailleText.substring(i, i + maxCharsPerLine))
  }

  // Mostrar cada línea con su símbolo Braille
  lines.slice(0, 3).forEach((line: string, lineIndex: number) => {
    let xPos = margin + 5
    const yPos = currentY + (lineIndex * 25)
    
    // Intentar mostrar símbolos Braille directamente
    doc.setFontSize(28)
    doc.text(line, xPos, yPos)
    
    // Agregar notación de puntos debajo (más pequeño)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    let dotsText = ""
    for (let char of line) {
      dotsText += (brailleToDots[char] || char) + " "
    }
    doc.text(dotsText.substring(0, 80), xPos, yPos + 6)
    doc.setTextColor(0, 0, 0)
  })

  currentY += 110 + 10

  // ===== SECCIÓN 2: TEXTO NORMAL EN ESPAÑOL =====
  // Marco azul para el texto en español
  doc.setDrawColor(41, 128, 185) // Azul
  doc.setLineWidth(1.5)
  doc.rect(margin, currentY, pageWidth - 2 * margin, 80) // Caja mediana

  currentY += 10

  // Etiqueta
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Texto Normal en español:", margin + 5, currentY)
  currentY += 15

  // Texto en español
  doc.setFont("helvetica", "normal")
  doc.setFontSize(14)
  
  const spanishText = translation.translationType === "TEXT_TO_BRAILLE" 
    ? translation.originalText 
    : translation.translatedText

  const spanishLines = doc.splitTextToSize(spanishText, pageWidth - 2 * margin - 10)
  spanishLines.slice(0, 3).forEach((line: string, index: number) => {
    doc.text(line, margin + 5, currentY + (index * 10))
  })

  // Pie de página
  const footerY = pageHeight - 15
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(128, 128, 128)
  doc.text("Generado por EasyBraille", pageWidth / 2, footerY, { align: "center" })

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
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
