import { describe, expect, it } from 'vitest'
import { hasMinimumServerRole, canUseAdminOverride } from './serverRole.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import {
  ServerRoleNotFoundError,
  ProjectRoleNotFoundError
} from '../domain/authErrors.js'
import { parseFeatureFlags } from '../../environment/index.js'

describe('hasMinimumServerRole returns a function, that', () => {
  it('throws uncoveredError for unexpected loader errors', async () => {
    await expect(
      hasMinimumServerRole({
        // @ts-expect-error deliberately testing an unexpected loader error
        getServerRole: async () => err(ProjectRoleNotFoundError)
      })({ userId: cryptoRandomString({ length: 10 }), role: 'server:user' })
    ).rejects.toThrowError(/Uncovered error/)
  })
  it.each([ServerRoleNotFoundError])(
    'turns expected loader error $code into false ',
    async (loaderError) => {
      const result = await hasMinimumServerRole({
        getServerRole: async () => err(loaderError)
      })({ userId: cryptoRandomString({ length: 10 }), role: 'server:user' })
      expect(result).toEqual(false)
    }
  )
  it('returns false for smaller roles', async () => {
    const result = await hasMinimumServerRole({
      getServerRole: async () => Promise.resolve(ok('server:user'))
    })({
      userId: cryptoRandomString({ length: 9 }),
      role: 'server:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true for roles with enough power', async () => {
    const result = await hasMinimumServerRole({
      getServerRole: () => Promise.resolve(ok('server:admin'))
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
      getEnv: async () => parseFeatureFlags({}),
      getServerRole: async () => {
        expect.fail()
      }
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns false for non admins if admin override is not enabled', async () => {
    const result = await canUseAdminOverride({
      getEnv: async () => parseFeatureFlags({}),
      getServerRole: async () => ok('server:user')
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns false for non admins if admin override is enabled', async () => {
    const result = await canUseAdminOverride({
      getEnv: async () => parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'true' }),
      getServerRole: async () => ok('server:user')
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(false)
  })
  it('returns true for admins if admin override is enabled', async () => {
    const result = await canUseAdminOverride({
      getEnv: async () => parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'true' }),
      getServerRole: async () => ok('server:admin')
    })({ userId: cryptoRandomString({ length: 10 }) })
    expect(result).toEqual(true)
  })
})
