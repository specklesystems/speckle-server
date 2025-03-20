import { describe, expect, it } from 'vitest'
import { requireExactServerRole } from './serverRole.js'
import cryptoRandomString from 'crypto-random-string'

describe('requireExactServerRole returns a function, that', () => {
  it('returns false for mismatch roles', async () => {
    const result = await requireExactServerRole({
      loaders: {
        getServerRole: () => Promise.resolve('server:user')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns false for users without roles', async () => {
    const result = await requireExactServerRole({
      loaders: {
        getServerRole: () => Promise.resolve(null)
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true for matching roles', async () => {
    const result = await requireExactServerRole({
      loaders: {
        getServerRole: () => Promise.resolve('server:admin')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(true)
  })
})
