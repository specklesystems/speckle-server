import { describe, expect, it } from 'vitest'
import { requireExactServerRole } from './serverRole.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import { ServerRoleNotFoundError } from '../domain/authErrors.js'

describe('requireExactServerRole returns a function, that', () => {
  it('returns false for mismatch roles', async () => {
    const result = await requireExactServerRole({
      loaders: {
        getServerRole: () => Promise.resolve(ok('server:user'))
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
        getServerRole: () => Promise.resolve(err(new ServerRoleNotFoundError()))
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
        getServerRole: () => Promise.resolve(ok('server:admin'))
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(true)
  })
})
