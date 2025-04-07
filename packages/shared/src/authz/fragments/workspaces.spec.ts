import { describe, expect, it } from 'vitest'
import { ensureWorkspaceRoleAndSessionFragment } from './workspaces.js'
import cryptoRandomString from 'crypto-random-string'
import {
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'

describe('maybeMemberRoleWithValidSsoSessionIfNeeded returns a function, that', () => {
  it('hides non existing workspaces behind a WorkspaceNoAccessError', async () => {
    const result = ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => null,
      getWorkspaceRole: async () => {
        expect.fail()
      },
      getWorkspaceSsoProvider: async () => {
        expect.fail()
      },
      getWorkspaceSsoSession: async () => {
        expect.fail()
      }
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).resolves.toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })
  it('returns WorkspaceNoAccessError if the user does not have a workspace role', async () => {
    const result = await ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => {
        expect.fail()
      },
      getWorkspaceSsoSession: async () => {
        expect.fail()
      }
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })
  it('returns nothing if user does not have a minimum workspace:member role', async () => {
    const result = await ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => 'workspace:guest',
      getWorkspaceSsoProvider: async () => {
        expect.fail()
      },
      getWorkspaceSsoSession: async () => {
        expect.fail()
      }
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toBeNothingResult()
  })
  it('returns just(ok()) if user is a member and workspace has no SSO provider', async () => {
    const result = await ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => 'workspace:member',
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => {
        expect.fail()
      }
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toBeAuthOKResult()
  })
  it('returns WorkspaceSsoSessionInvalidError if user does not have an SSO session', async () => {
    const result = ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => 'workspace:member',
      getWorkspaceSsoProvider: async () => ({
        providerId: cryptoRandomString({ length: 10 })
      }),
      getWorkspaceSsoSession: async () => null
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })

    await expect(result).resolves.toBeAuthErrorResult({
      code: WorkspaceSsoSessionNoAccessError.code,
      payload: { workspaceSlug: 'bbb' }
    })
  })
  it('returns WorkspaceSsoSessionInvalidError if user has an expired sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() - 1)

    const result = await ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => 'workspace:member',
      getWorkspaceSsoProvider: async () => ({
        providerId: cryptoRandomString({ length: 10 })
      }),
      getWorkspaceSsoSession: async () => ({ providerId, validUntil, userId })
    })({
      userId,
      workspaceId
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceSsoSessionNoAccessError.code,
      payload: { workspaceSlug: 'bbb' }
    })
  })
  it('returns true if user has a valid sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 100)

    const result = await ensureWorkspaceRoleAndSessionFragment({
      getWorkspace: async () => ({
        id: 'aaa',
        slug: 'bbb'
      }),
      getWorkspaceRole: async () => 'workspace:member',
      getWorkspaceSsoProvider: async () => ({
        providerId: cryptoRandomString({ length: 10 })
      }),
      getWorkspaceSsoSession: async () => ({ providerId, validUntil, userId })
    })({
      userId,
      workspaceId
    })
    expect(result).toBeAuthOKResult()
  })
})
