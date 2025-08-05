import { isValidBase64Image } from './base64.js'
import { describe, it, expect } from 'vitest'

describe('isValidBase64Image', () => {
  it('returns true for a valid base64 PNG image', () => {
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
    expect(isValidBase64Image(validPng)).toBe(true)
  })

  it('returns true for a valid base64 JPEG image', () => {
    const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'
    expect(isValidBase64Image(validJpeg)).toBe(true)
  })

  it('returns false if string does not start with data:image/', () => {
    const invalid = 'data:text/plain;base64,SGVsbG8gd29ybGQ='
    expect(isValidBase64Image(invalid)).toBe(false)
  })

  it('returns false if there is no comma separator', () => {
    const invalid = 'data:image/png;base64iVBORw0KGgoAAAANSUhEUgAAAAUA'
    expect(isValidBase64Image(invalid)).toBe(false)
  })

  it('returns false if base64 part is invalid', () => {
    const invalid = 'data:image/png;base64,not_base64!'
    expect(isValidBase64Image(invalid)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidBase64Image('')).toBe(false)
  })

  it('returns false for data:image/ with empty base64', () => {
    expect(isValidBase64Image('data:image/png;base64,')).toBe(false)
  })

  it('returns true for valid base64 with whitespace', () => {
    const validWithWhitespace = 'data:image/png;base64,iVBOR w0KGgoA AAANSUhEUgAAAAUA'
    expect(isValidBase64Image(validWithWhitespace)).toBe(true)
  })
})
