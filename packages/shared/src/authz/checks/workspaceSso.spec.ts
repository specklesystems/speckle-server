import { describe, expect, it } from 'vitest'
import { requireValidWorkspaceSsoSession } from './workspaceSso.js'
import cryptoRandomString from 'crypto-random-string'

describe('requireValidWorkspaceSsoSession returns a function, that', () => {
  it('returns false if user does not have an SSO session', async () => {
    const result = await requireValidWorkspaceSsoSession({
      loaders: {
        getWorkspaceSsoSession: () => Promise.resolve(null)
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBe(false)
  })
  it('returns false if user has an expired sso session', async () => {
    const userId = cryptoRandomString({ length: 9 })
    const providerId = cryptoRandomString({ length: 9 })
    const workspaceId = cryptoRandomString({ length: 9 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() - 1)

    const result = await requireValidWorkspaceSsoSession({
      loaders: {
        getWorkspaceSsoSession: () =>
          Promise.resolve({
            userId,
            providerId,
            validUntil
          })
      }
    })({
      userId,
      workspaceId
    })
    expect(result).toBe(false)
  })
  it('returns true if user has a valid sso session', async () => {
    const userId = cryptoRandomString({ length: 9 })
    const providerId = cryptoRandomString({ length: 9 })
    const workspaceId = cryptoRandomString({ length: 9 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 1)

    const result = await requireValidWorkspaceSsoSession({
      loaders: {
        getWorkspaceSsoSession: () =>
          Promise.resolve({
            userId,
            providerId,
            validUntil
          })
      }
    })({
      userId,
      workspaceId
    })
    expect(result).toBe(true)
  })
})
