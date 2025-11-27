import { describe, it, expect } from '@jest/globals'
import { translateToBraille, translateFromBraille } from '../brailleTranslator'

describe('Braille Translator', () => {
  describe('translateToBraille', () => {
    it('should translate simple Spanish text to Braille', () => {
      const result = translateToBraille('hola')
      expect(result).toBe('⠓⠕⠇⠁')
    })

    it('should handle uppercase letters', () => {
      const result = translateToBraille('HOLA')
      expect(result).toBe('⠓⠕⠇⠁')
    })

    it('should handle spaces', () => {
      const result = translateToBraille('tu voz')
      expect(result).toBe('⠞⠥⠀⠧⠕⠵')
    })

    it('should handle special characters', () => {
      const result = translateToBraille('hola.')
      expect(result).toContain('⠄')
    })

    it('should handle accented characters', () => {
      const result = translateToBraille('áéíóú')
      expect(result).toBeTruthy()
    })

    it('should handle empty string', () => {
      const result = translateToBraille('')
      expect(result).toBe('')
    })

    it('should handle numbers', () => {
      const result = translateToBraille('123')
      expect(result).toBeTruthy()
    })
  })

  describe('translateFromBraille', () => {
    it('should translate Braille to Spanish', () => {
      const result = translateFromBraille('⠓⠕⠇⠁')
      expect(result).toBe('hola')
    })

    it('should handle spaces in Braille', () => {
      const result = translateFromBraille('⠞⠥ ⠧⠕⠵')
      expect(result).toBe('tu voz')
    })

    it('should handle empty Braille string', () => {
      const result = translateFromBraille('')
      expect(result).toBe('')
    })

    it('should handle special Braille characters', () => {
      const result = translateFromBraille('⠓⠕⠇⠁⠄')
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle mixed content', () => {
      const result = translateToBraille('Hola123!')
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should be reversible for simple text', () => {
      const original = 'hola mundo'
      const braille = translateToBraille(original)
      const backToSpanish = translateFromBraille(braille)
      expect(backToSpanish).toBe(original)
    })
  })
})
