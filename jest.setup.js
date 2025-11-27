// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills para Node.js
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock de Web Serial API
global.navigator = {
  ...global.navigator,
  serial: {
    requestPort: jest.fn(),
    getPorts: jest.fn(() => Promise.resolve([])),
  },
}
