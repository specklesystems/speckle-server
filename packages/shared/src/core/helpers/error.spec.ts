import { describe, it, expect } from 'vitest'
import { errorToString, getErrorMessage } from './error.js'

describe('errorToString', () => {
  it('should stringify non-Error objects', () => {
    const obj = { foo: 'bar', num: 42 }
    const result = errorToString(obj)
    expect(result).toBe('{"foo":"bar","num":42}')
  })

  it('should handle primitive values', () => {
    expect(errorToString('string error')).toBe('"string error"')
    expect(errorToString(123)).toBe('123')
    expect(errorToString(true)).toBe('true')
    expect(errorToString(null)).toBe('null')
    expect(errorToString(undefined)).toBeUndefined()
  })

  it('should fallback to String() for non-serializable objects', () => {
    const circular: Record<string, unknown> = { name: 'circular' }
    circular.self = circular

    const result = errorToString(circular)
    expect(result).toBe('[object Object]')
  })

  it('should return stack trace for Error objects', () => {
    const error = new Error('Test error')
    const result = errorToString(error)

    expect(result).toContain('Test error')
    expect(result).toContain('Error: Test error')
  })

  it('should fallback to message if no stack', () => {
    const error = new Error('Test message')
    // Remove stack to test fallback
    delete (error as Error & { stack?: string }).stack

    const result = errorToString(error)
    expect(result).toBe('Test message')
  })

  it('should fallback to String(error) if no stack or message', () => {
    const error = new Error()
    delete (error as Error & { stack?: string }).stack
    // Use Reflect.deleteProperty to avoid TypeScript error
    Reflect.deleteProperty(error, 'message')

    const result = errorToString(error)
    expect(result).toBe('Error')
  })

  it('should handle Error with cause property', () => {
    const rootCause = new Error('Root cause')
    const error = new Error('Main error') as Error & { cause?: Error }
    error.cause = rootCause

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('Cause: ')
    expect(result).toContain('Root cause')
  })

  it('should handle Error with jse_cause property', () => {
    const rootCause = new Error('JSE root cause')
    const error = new Error('Main error') as Error & { jse_cause?: Error }
    error['jse_cause'] = rootCause

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('Cause: ')
    expect(result).toContain('JSE root cause')
  })

  it('should handle nested causes recursively', () => {
    const deepCause = new Error('Deep cause')
    const midCause = new Error('Mid cause') as Error & { cause?: Error }
    midCause.cause = deepCause

    const error = new Error('Top error') as Error & { cause?: Error }
    error.cause = midCause

    const result = errorToString(error)
    expect(result).toContain('Top error')
    expect(result).toContain('Mid cause')
    expect(result).toContain('Deep cause')

    // Should have nested "Cause:" labels
    const causeCount = (result.match(/Cause: /g) || []).length
    expect(causeCount).toBe(2)
  })

  it('should prioritize jse_cause over cause when both are present', () => {
    const jseCause = new Error('JSE cause')
    const stdCause = new Error('Standard cause')

    const error = new Error('Main error') as Error & {
      cause?: Error
      jse_cause?: Error
    }
    error.cause = stdCause
    error['jse_cause'] = jseCause

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('JSE cause')
    // Should NOT contain cause since jse_cause takes priority
    expect(result).not.toContain('Standard cause')

    // Should have only one "Cause:" label
    const causeCount = (result.match(/Cause: /g) || []).length
    expect(causeCount).toBe(1)
  })

  it('should handle cause when jse_cause is not present', () => {
    const stdCause = new Error('Standard cause')

    const error = new Error('Main error') as Error & { cause?: Error }
    error.cause = stdCause

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('Standard cause')

    // Should have one "Cause:" label
    const causeCount = (result.match(/Cause: /g) || []).length
    expect(causeCount).toBe(1)
  })

  it('should handle error with no cause properties', () => {
    const error = new Error('Error without cause')

    const result = errorToString(error)
    expect(result).toContain('Error without cause')
    expect(result).not.toContain('Cause:')

    // Should have no "Cause:" labels
    const causeCount = (result.match(/Cause: /g) || []).length
    expect(causeCount).toBe(0)
  })

  it('should handle non-Error causes', () => {
    const error = new Error('Main error') as Error & { cause?: unknown }
    error.cause = { type: 'custom', message: 'Custom cause' }

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('Cause: {"type":"custom","message":"Custom cause"}')
  })

  it('should handle circular reference in causes', () => {
    const error = new Error('Main error') as Error & { cause?: unknown }
    const cause: Record<string, unknown> = { message: 'Circular cause' }
    cause.self = cause
    error.cause = cause

    const result = errorToString(error)
    expect(result).toContain('Main error')
    expect(result).toContain('Cause: [object Object]')
  })
})

describe('getErrorMessage', () => {
  it('should return message from Error objects', () => {
    const error = new Error('Test error message')
    const result = getErrorMessage(error)
    expect(result).toBe('Test error message')
  })

  it('should return message from objects with message property', () => {
    const errorLike = { message: 'Custom error message', code: 500 }
    const result = getErrorMessage(errorLike)
    expect(result).toBe('Custom error message')
  })

  it('should return string values directly', () => {
    const stringError = 'This is a string error'
    const result = getErrorMessage(stringError)
    expect(result).toBe('This is a string error')
  })

  it('should ignore non-string message properties', () => {
    const errorLike = { message: 123, other: 'value' }
    const result = getErrorMessage(errorLike)
    expect(result).toBe('{"message":123,"other":"value"}')
  })

  it('should stringify objects without message property', () => {
    const obj = { foo: 'bar', num: 42 }
    const result = getErrorMessage(obj)
    expect(result).toBe('{"foo":"bar","num":42}')
  })

  it('should handle primitive values', () => {
    expect(getErrorMessage(123)).toBe('123')
    expect(getErrorMessage(true)).toBe('true')
    expect(getErrorMessage(null)).toBe('null')
    expect(getErrorMessage(undefined)).toBe('undefined')
  })

  it('should fallback to String() for non-serializable objects', () => {
    const circular: Record<string, unknown> = { name: 'circular' }
    circular.self = circular

    const result = getErrorMessage(circular)
    expect(result).toBe('[object Object]')
  })

  it('should handle empty Error message', () => {
    const error = new Error('')
    const result = getErrorMessage(error)
    expect(result).toBe('')
  })
})
