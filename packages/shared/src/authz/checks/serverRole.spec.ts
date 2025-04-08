import { describe, expect, it } from 'vitest'
import { hasMinimumServerRole, canUseAdminOverride } from './serverRole.js'
import cryptoRandomString from 'crypto-random-string'

describe('hasMinimumServerRole returns a function, that', () => {
  it('turns non existing server roles into false ', async () => {
    const result = await hasMinimumServerRole({
      getServerRole: async () => null
    })({ userId: cryptoRandomString({ length: 10 }), role: 'server:user' })
    expect(result).toEqual(false)
  })
  it('returns false for smaller roles', async () => {
    const result = await hasMinimumServerRole({
      getServerRole: async () => 'server:user'
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true for roles with enough power', async () => {
    const result = await hasMinimumServerRole({
      getServerRole: async () => 'server:admin'
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:guest'
    })
    expect(result).toEqual(true)
  })
})

describe('canUseAdminOverride returns a function, that', () => {
  it('returns false for admins if admin override is not enabled', async () => {
    const result = await canUseAdminOverride({
      getAdminOverrideEnabled: async () => false,
      getServerRole: async () => {
        expect.fail()
      }
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns false for non admins if admin override is not enabled', async () => {
    const result = await canUseAdminOverride({
      getAdminOverrideEnabled: async () => false,
      getServerRole: async () => 'server:user'
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns false for non admins if admin override is enabled', async () => {
    const result = await canUseAdminOverride({
      getAdminOverrideEnabled: async () => true,
      getServerRole: async () => 'server:user'
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns true for admins if admin override is enabled', async () => {
    const result = await canUseAdminOverride({
      getAdminOverrideEnabled: async () => true,
      getServerRole: async () => 'server:admin'
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(true)
  })
})
