import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TranslatorPage from '../../app/translator/page'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('TranslatorPage Component', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    }
  })

  it('should render translator page', () => {
    render(<TranslatorPage />)
    expect(screen.getByText('Traductor de Braille')).toBeInTheDocument()
  })

  it('should render three tabs', () => {
    render(<TranslatorPage />)
    expect(screen.getByText('Texto')).toBeInTheDocument()
    expect(screen.getByText('Imagen')).toBeInTheDocument()
    expect(screen.getByText('Teclado Braille')).toBeInTheDocument()
  })

  it('should have input and output textareas', () => {
    render(<TranslatorPage />)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBeGreaterThanOrEqual(2)
  })

  it('should have translate button', () => {
    render(<TranslatorPage />)
    const translateButton = screen.getByText('Traducir')
    expect(translateButton).toBeInTheDocument()
  })

  it('should translate Spanish to Braille when clicking translate', async () => {
    render(<TranslatorPage />)
    
    const textareas = screen.getAllByRole('textbox')
    const inputTextarea = textareas[0]
    
    fireEvent.change(inputTextarea, { target: { value: 'hola' } })
    
    const translateButton = screen.getByText('Traducir')
    fireEvent.click(translateButton)
    
    // Wait for translation to complete
    await waitFor(() => {
      const outputTextarea = textareas[1] as HTMLTextAreaElement
      // Just verify it has some content after translation
      expect(outputTextarea.value.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should swap translation direction', async () => {
    render(<TranslatorPage />)
    
    const swapButton = screen.getByText(/Cambiar dirección/i)
    expect(swapButton).toBeInTheDocument()
    
    fireEvent.click(swapButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Braille a Español/i)).toBeInTheDocument()
    })
  })

  it('should show braille keyboard when button clicked', () => {
    render(<TranslatorPage />)
    
    const keyboardButton = screen.getByText(/Mostrar teclado/i)
    fireEvent.click(keyboardButton)
    
    expect(screen.getByText(/Ocultar teclado/i)).toBeInTheDocument()
  })

  it('should clear text when clear button clicked', () => {
    render(<TranslatorPage />)
    
    const textareas = screen.getAllByRole('textbox')
    const inputTextarea = textareas[0]
    
    fireEvent.change(inputTextarea, { target: { value: 'test' } })
    
    const clearButton = screen.getByText('Limpiar')
    fireEvent.click(clearButton)
    
    expect(inputTextarea).toHaveValue('')
  })

  it('should disable translate button when input is empty', () => {
    render(<TranslatorPage />)
    
    const translateButton = screen.getByText('Traducir')
    expect(translateButton).toBeDisabled()
  })

  it('should enable translate button when input has text', () => {
    render(<TranslatorPage />)
    
    const textareas = screen.getAllByRole('textbox')
    const inputTextarea = textareas[0]
    
    fireEvent.change(inputTextarea, { target: { value: 'hola' } })
    
    const translateButton = screen.getByText('Traducir')
    expect(translateButton).not.toBeDisabled()
  })
})
