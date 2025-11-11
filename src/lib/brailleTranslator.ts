// Mapeo de caracteres a Braille (español)
const textToBrailleMap: Record<string, string> = {
  a: "⠁",
  b: "⠃",
  c: "⠉",
  d: "⠙",
  e: "⠑",
  f: "⠋",
  g: "⠛",
  h: "⠓",
  i: "⠊",
  j: "⠚",
  k: "⠅",
  l: "⠇",
  m: "⠍",
  n: "⠝",
  ñ: "⠻",
  o: "⠕",
  p: "⠏",
  q: "⠟",
  r: "⠗",
  s: "⠎",
  t: "⠞",
  u: "⠥",
  v: "⠧",
  w: "⠺",
  x: "⠭",
  y: "⠽",
  z: "⠵",
  á: "⠷",
  é: "⠮",
  í: "⠾",
  ó: "⠪",
  ú: "⠳",
  ü: "⠳",
  "0": "⠴",
  "1": "⠂",
  "2": "⠆",
  "3": "⠒",
  "4": "⠲",
  "5": "⠢",
  "6": "⠖",
  "7": "⠶",
  "8": "⠦",
  "9": "⠔",
  ".": "⠄",
  ",": "⠠",
  ";": "⠰",
  ":": "⠱",
  "?": "⠹",
  "!": "⠮",
  '"': "⠐",
  "'": "⠄",
  "(": "⠣",
  ")": "⠜",
  "-": "⠤",
  "+": "⠬",
  "*": "⠡",
  "/": "⠌",
  "=": "⠿",
  "@": "⠈",
  "#": "⠼",
  "%": "⠩",
  "&": "⠯",
  _: "⠸",
  " ": "⠀",
}

// Mapeo inverso de Braille a caracteres
const brailleToTextMap: Record<string, string> = {}
for (const [key, value] of Object.entries(textToBrailleMap)) {
  brailleToTextMap[value] = key
}

/**
 * Traduce texto normal a Braille
 * @param text Texto a traducir
 * @returns Texto en Braille
 */
export function translateToBraille(text: string): string {
  if (!text) return ""

  // Convertir a minúsculas para simplificar
  const lowerText = text.toLowerCase()

  let result = ""
  for (let i = 0; i < lowerText.length; i++) {
    const char = lowerText[i]
    result += textToBrailleMap[char] || char
  }

  return result
}

/**
 * Traduce texto en Braille a texto normal
 * @param brailleText Texto en Braille
 * @returns Texto normal
 */
export function translateFromBraille(brailleText: string): string {
  if (!brailleText) return ""

  let result = ""
  // Procesar cada carácter Braille
  for (let i = 0; i < brailleText.length; i++) {
    const brailleChar = brailleText[i]
    result += brailleToTextMap[brailleChar] || brailleChar
  }

  return result
}
