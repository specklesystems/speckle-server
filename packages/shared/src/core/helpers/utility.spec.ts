import { describe, expect, test } from 'vitest'
import { xor } from './utility.js'

describe('xor', () => {
  test('returns true if only one of the arguments is truthy', () => {
    expect(xor(true, false)).toBe(true)
    expect(xor(false, true)).toBe(true)
    expect(xor(true, true)).toBe(false)
    expect(xor(false, false)).toBe(false)
  })
})
