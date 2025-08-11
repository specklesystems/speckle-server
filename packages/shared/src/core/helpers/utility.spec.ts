import { describe, expect, test } from 'vitest'
import { xor, StringEnum } from './utility.js'

describe('xor', () => {
  test('returns true if only one of the arguments is truthy', () => {
    expect(xor(true, false)).toBe(true)
    expect(xor(false, true)).toBe(true)
    expect(xor(true, true)).toBe(false)
    expect(xor(false, false)).toBe(false)
  })
})

describe('StringEnum', () => {
  const Colors = StringEnum(['RED', 'GREEN', 'BLUE'])

  test('creates an object with keys and values matching the input strings', () => {
    expect(Colors).toEqual({
      RED: 'RED',
      GREEN: 'GREEN',
      BLUE: 'BLUE'
    })
  })

  test('works with empty array', () => {
    const EmptyEnum = StringEnum([])
    expect(EmptyEnum).toEqual({})
    expect(Object.isFrozen(EmptyEnum)).toBe(true)
  })
})
