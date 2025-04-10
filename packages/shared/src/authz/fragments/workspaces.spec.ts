import { describe, expect, it } from 'vitest'
import {
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from './workspaces.js'
import cryptoRandomString from 'crypto-random-string'
import {
  WorkspaceNoAccessError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { OverridesOf } from '../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../environment/index.js'

describe('ensureWorkspaceRoleAndSessionFragment', () => {
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
  it('returns ok w/o checking session if user is a workspace guest', async () => {
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
    expect(result).toBeAuthOKResult()
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

describe('ensureWorkspacesEnabledFragment', () => {
  const buildSUT = (overrides?: OverridesOf<typeof ensureWorkspacesEnabledFragment>) =>
    ensureWorkspacesEnabledFragment({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true'
        }),
      ...overrides
    })

  it('returns ok when workspaces are enabled', async () => {
    const sut = buildSUT()
    const result = await sut({})
    expect(result).toBeOKResult()
  })

  it('returns err when workspaces are disabled', async () => {
    const sut = buildSUT({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        })
    })
    const result = await sut({})
    expect(result).toBeAuthErrorResult({
      code: WorkspacesNotEnabledError.code
    })
  })
})
