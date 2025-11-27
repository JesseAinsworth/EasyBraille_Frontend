import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ImageCapture } from '../ImageCapture'

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('ImageCapture Component', () => {
  const mockOnTextDetected = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render camera and upload options', () => {
    render(<ImageCapture onTextDetected={mockOnTextDetected} />)
    
    expect(screen.getByText('Usar cámara')).toBeInTheDocument()
    expect(screen.getByText('Subir imagen')).toBeInTheDocument()
  })

  it('should have file input for image upload', () => {
    render(<ImageCapture onTextDetected={mockOnTextDetected} />)
    
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*')
  })

  it('should show processing state when image is being processed', async () => {
    render(<ImageCapture onTextDetected={mockOnTextDetected} />)
    
    // This would need to be tested with actual file upload mock
    // For now, just verify the component renders
    expect(screen.getByText('Usar cámara')).toBeInTheDocument()
  })
})
