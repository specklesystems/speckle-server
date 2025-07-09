import { describe, expect, test } from 'vitest'
import md5 from './md5.js'

describe('md5', () => {
  test('returns a valid md5 hash', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592')
    expect(md5('world')).toBe('7d793037a0760186574b0282f2f435e7')
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })
})
