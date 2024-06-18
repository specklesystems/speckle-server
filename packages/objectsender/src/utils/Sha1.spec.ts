import { expect, describe, it } from 'vitest'
import { SHA1 } from './Sha1'

describe('SHA1 encryption', () => {
  it.each([
    ['le speckle', '67413ddfa55bab1b735d4d90bf5be7f5fafbcdfb'],
    [
      'the quick brown fox jumped over the lazy dog? i think',
      'b724fbdc205bae3b1d7511304ec4b576af563f93'
    ],
    ['1', '356a192b7913b04c54574d18c28d46e6395428ab']
  ])('SHA1(%s) should return %s', (input, expected) => {
    expect(SHA1(input)).toBe(expected)
  })
})
