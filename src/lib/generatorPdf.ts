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
  const lineHeight = 10
  let currentY = margin

  // Función para agregar texto con salto de línea automático
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12): number => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)

    lines.forEach((line: string, index: number) => {
      if (y + index * lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, x, y + index * lineHeight)
    })

    return y + lines.length * lineHeight
  }

  // Encabezado
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("EasyBraille - Traducción", pageWidth / 2, currentY, { align: "center" })
  currentY += 20

  // Información de la traducción
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")

  const translationTypeText =
    translation.translationType === "TEXT_TO_BRAILLE" ? "Español a Braille" : "Braille a Español"

  doc.text(`Tipo de traducción: ${translationTypeText}`, margin, currentY)
  currentY += lineHeight

  if (translation.timestamp) {
    const dateStr = translation.timestamp.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    doc.text(`Fecha: ${dateStr}`, margin, currentY)
    currentY += lineHeight
  }

  if (translation.language) {
    doc.text(`Idioma: ${translation.language.toUpperCase()}`, margin, currentY)
    currentY += lineHeight
  }

  currentY += 10

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 15

  // Texto original
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const originalLabel = translation.translationType === "TEXT_TO_BRAILLE" ? "Texto en Español:" : "Texto en Braille:"
  doc.text(originalLabel, margin, currentY)
  currentY += 15

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  // Para texto Braille, usar una fuente monospace
  if (translation.translationType === "BRAILLE_TO_TEXT") {
    doc.setFont("courier", "normal")
    doc.setFontSize(16)
  }

  currentY = addWrappedText(translation.originalText, margin, currentY, pageWidth - 2 * margin)
  currentY += 15

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 15

  // Texto traducido
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  const translatedLabel = translation.translationType === "TEXT_TO_BRAILLE" ? "Texto en Braille:" : "Texto en Español:"
  doc.text(translatedLabel, margin, currentY)
  currentY += 15

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)

  // Para texto Braille, usar una fuente monospace
  if (translation.translationType === "TEXT_TO_BRAILLE") {
    doc.setFont("courier", "normal")
    doc.setFontSize(16)
  }

  currentY = addWrappedText(translation.translatedText, margin, currentY, pageWidth - 2 * margin)

  // Pie de página
  const footerY = pageHeight - 20
  doc.setFontSize(10)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(128, 128, 128)
  doc.text("Generado por EasyBraille - Traductor de Braille Accesible", pageWidth / 2, footerY, { align: "center" })
  doc.text(`© ${new Date().getFullYear()} EasyBraille. Todos los derechos reservados.`, pageWidth / 2, footerY + 8, {
    align: "center",
  })

  // Generar nombre del archivo
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
  const filename = `traduccion-braille-${timestamp}.pdf`

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
