import { describe, expect, it } from 'vitest'
import {
  requireAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from './workspaceRole.js'
import cryptoRandomString from 'crypto-random-string'

describe('requireAnyWorkspaceRole returns a function, that', () => {
  it('returns false if the user has no role', async () => {
    const result = await requireAnyWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve(null)
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(false)
  })
  it('returns true if the user has a role', async () => {
    const result = await requireAnyWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve('workspace:member')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(true)
  })
})

describe('requireMinimumWorkspaceRole returns a function, that', () => {
  it('returns false if user does not have a role', async () => {
    const result = await requireMinimumWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve(null)
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(false)
  })
  it('returns false if user is below target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve('workspace:member')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 }),
      role: 'workspace:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true if user matches target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve('workspace:member')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
  it('returns true if user exceeds target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      loaders: {
        getWorkspaceRole: () => Promise.resolve('workspace:admin')
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
})
