import { describe, it, expect } from 'vitest'
import { errorToString } from './error.js'

describe('errorToString', () => {
  it('stringifies plain non-error values', () => {
    expect(errorToString({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}')
    expect(errorToString([1, 2, 3])).toBe('[1,2,3]')
    expect(errorToString('oops')).toBe('"oops"')
    expect(errorToString(42)).toBe('42')
    expect(errorToString(true)).toBe('true')
    // null is valid JSON
    expect(errorToString(null)).toBe('null')
  })

  it('falls back to String(e) when JSON.stringify fails (circular)', () => {
    const a: Record<string, unknown> = {}
    a.self = a
    // JSON.stringify would throw "Converting circular structure to JSON"
    // errorToString should catch and fall back to String(e)
    expect(errorToString(a)).toBe('[object Object]')
  })

  it('includes error message and stack for Error', () => {
    const err = new Error('Top level')
    const s = errorToString(err)
    expect(s).toContain('Top level')
    // Should look like a stack string
    expect(s).toMatch(/Error: Top level\n/) // first line commonly formatted like this
  })

  it('recursively includes standard cause property', () => {
    const inner = new Error('Inner cause')
    const outer: { cause?: unknown } & Error = new Error('Top w/ cause')
    outer.cause = inner
    const s = errorToString(outer)
    expect(s).toContain('Top w/ cause')
    expect(s).toContain('Cause:')
    expect(s).toContain('Inner cause')
  })

  it('supports jse_cause property', () => {
    const inner = new Error('Legacy inner')
    const outer = new Error('Top legacy') as Error & { [key: string]: unknown }
    outer['jse_cause'] = inner
    const s = errorToString(outer)
    expect(s).toContain('Top legacy')
    expect(s).toContain('Cause:')
    expect(s).toContain('Legacy inner')
  })

  it('handles non-Error cause values', () => {
    const outer = new Error('Top with non-error cause') as Error & {
      cause?: unknown
      [key: string]: unknown
    }
    outer.cause = { a: 1 }
    const s1 = errorToString(outer)
    expect(s1).toContain('Top with non-error cause')
    expect(s1).toContain('Cause: {"a":1}')

    const circular: Record<string, unknown> = {}
    circular.self = circular
    outer['jse_cause'] = circular
    const s2 = errorToString(outer)
    // One of the causes will be circular, should fall back to String(e)
    expect(s2).toContain('Top with non-error cause')
    expect(s2).toContain('Cause: [object Object]')
  })
})
