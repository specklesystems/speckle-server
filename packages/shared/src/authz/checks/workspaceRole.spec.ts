import { describe, expect, it } from 'vitest'
import { hasAnyWorkspaceRole, requireMinimumWorkspaceRole } from './workspaceRole.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import {
  WorkspaceRoleNotFoundError,
  ProjectRoleNotFoundError
} from '../domain/authErrors.js'

describe('hasAnyWorkspaceRole returns a function, that', () => {
  it('throws uncoveredError for unexpected loader errors', async () => {
    await expect(
      hasAnyWorkspaceRole({
        // @ts-expect-error deliberately testing an unexpected loader error
        getWorkspaceRole: async () => err(ProjectRoleNotFoundError)
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 })
      })
    ).rejects.toThrowError(/Uncovered error/)
  })
  it.each([WorkspaceRoleNotFoundError])(
    'turns expected loader error $code into false ',
    async (loaderError) => {
      const result = await hasAnyWorkspaceRole({
        getWorkspaceRole: async () => err(loaderError)
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 })
      })
      expect(result).toEqual(false)
    }
  )
  it('returns false if the user has no role', async () => {
    const result = await hasAnyWorkspaceRole({
      getWorkspaceRole: async () => err(WorkspaceRoleNotFoundError)
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(false)
  })
  it('returns true if the user has a role', async () => {
    const result = await hasAnyWorkspaceRole({
      getWorkspaceRole: async () => ok('workspace:member')
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toEqual(true)
  })
})

describe('requireMinimumWorkspaceRole returns a function, that', () => {
  it('throws uncoveredError for unexpected loader errors', async () => {
    await expect(
      requireMinimumWorkspaceRole({
        // @ts-expect-error deliberately testing an unexpected loader error
        getWorkspaceRole: async () => err(ProjectRoleNotFoundError)
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 }),
        role: 'workspace:member'
      })
    ).rejects.toThrowError(/Uncovered error/)
  })
  it.each([WorkspaceRoleNotFoundError])(
    'turns expected loader error $code into false ',
    async (loaderError) => {
      const result = await requireMinimumWorkspaceRole({
        getWorkspaceRole: async () => err(loaderError)
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 }),
        role: 'workspace:member'
      })
      expect(result).toEqual(false)
    }
  )
  it('returns false if user is below target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      getWorkspaceRole: () => Promise.resolve(ok('workspace:member'))
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:admin'
    })
    expect(result).toEqual(false)
  })
  it('returns true if user matches target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      getWorkspaceRole: () => Promise.resolve(ok('workspace:member'))
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
  it('returns true if user exceeds target role', async () => {
    const result = await requireMinimumWorkspaceRole({
      getWorkspaceRole: () => Promise.resolve(ok('workspace:admin'))
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 }),
      role: 'workspace:member'
    })
    expect(result).toEqual(true)
  })
})
