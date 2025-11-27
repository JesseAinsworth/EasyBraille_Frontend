import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrailleKeyboard } from '../BrailleKeyboard'

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('BrailleKeyboard Component', () => {
  const mockOnTextInput = jest.fn()
  const mockOnBackspace = jest.fn()
  const mockOnSpace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('should render braille keyboard component', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    expect(screen.getByText(/Teclado Braille/i)).toBeInTheDocument()
  })

  it('should have connect arduino button', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    const connectButton = screen.getByText(/Conectar Arduino/i)
    expect(connectButton).toBeInTheDocument()
  })

  it('should show keyboard info message', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    // Check for keyboard message
    expect(screen.getByText(/Presiona una tecla para comenzar/i)).toBeInTheDocument()
  })

  it('should render connect arduino button', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    const connectButton = screen.getByText(/Conectar Arduino/i)
    expect(connectButton).toBeInTheDocument()
  })

  it('should show disconnected status', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    const statusBadge = screen.getByText('Desconectado')
    expect(statusBadge).toBeInTheDocument()
  })

  it('should have link to EasyBraille.com', () => {
    render(
      <BrailleKeyboard
        onTextInput={mockOnTextInput}
        onBackspace={mockOnBackspace}
        onSpace={mockOnSpace}
      />
    )
    
    const link = screen.getByText(/Ir a EasyBraille.com/i)
    expect(link).toBeInTheDocument()
  })
})
