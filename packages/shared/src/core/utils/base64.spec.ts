import { describe, expect, it } from 'vitest'
import { base64Decode, base64Encode } from './base64.js'

describe('base64Encode & base64Decode', () => {
  it('should encode/decode a string to base64', () => {
    const str = 'Hello, World!'
    const encoded = base64Encode(str)
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==')

    const decoded = base64Decode(encoded)
    expect(decoded).toBe(str)
  })

  it('should handle empty strings', () => {
    const str = ''
    const encoded = base64Encode(str)
    expect(encoded).toBe('')

    const decoded = base64Decode(encoded)
    expect(decoded).toBe(str)
  })

  it('should handle special characters', () => {
    const str = '¡Hola, Mundo!'
    const encoded = base64Encode(str)
    expect(encoded).toBe('wqFIb2xhLCBNdW5kbyE=')

    const decoded = base64Decode(encoded)
    expect(decoded).toBe(str)
  })
})
