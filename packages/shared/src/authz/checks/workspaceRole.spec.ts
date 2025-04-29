import { describe, expect, it } from 'vitest'
import { hasAnyWorkspaceRole, hasMinimumWorkspaceRole } from './workspaceRole.js'
import cryptoRandomString from 'crypto-random-string'

describe('hasAnyWorkspaceRole returns a function, that', () => {
  it('returns false if the user has no role', async () => {
    const result = await hasAnyWorkspaceRole({
      getWorkspaceRole: async () => null
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(false)
  })
  it('returns true if the user has a role', async () => {
    const result = await hasAnyWorkspaceRole({
      getWorkspaceRole: async () => 'workspace:member'
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(true)
  })
})

describe('requireMinimumWorkspaceRole returns a function, that', () => {
  it('turns non existing workspace role into false ', async () => {
    const result = await hasMinimumWorkspaceRole({
      getWorkspaceRole: async () => null
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(false)
  })
  it('returns false if user is below target role', async () => {
    const result = await hasMinimumWorkspaceRole({
      getWorkspaceRole: async () => 'workspace:member'
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true if user matches target role', async () => {
    const result = await hasMinimumWorkspaceRole({
      getWorkspaceRole: async () => 'workspace:member'
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
  it('returns true if user exceeds target role', async () => {
    const result = await hasMinimumWorkspaceRole({
      getWorkspaceRole: async () => 'workspace:admin'
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
})
