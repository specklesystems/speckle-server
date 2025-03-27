import { describe, expect, it } from 'vitest'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from './workspaceSso.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import {
  ProjectNotFoundError,
  WorkspaceRoleNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionInvalidError,
  WorkspaceSsoSessionNotFoundError
} from '../domain/authErrors.js'
import { just, nothing } from 'true-myth/maybe'

describe('maybeMemberRoleWithValidSsoSessionIfNeeded returns a function, that', () => {
  it('returns nothing if user does not have a workspace role', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => err(WorkspaceRoleNotFoundError),
      getWorkspaceSsoProvider: async () => err(WorkspaceSsoProviderNotFoundError),
      getWorkspaceSsoSession: async () => err(WorkspaceSsoSessionNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(nothing())
  })
  it('returns nothing if user does not have a minimum workspace:member role', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:guest'),
      getWorkspaceSsoProvider: async () => err(WorkspaceSsoProviderNotFoundError),
      getWorkspaceSsoSession: async () => err(WorkspaceSsoSessionNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(nothing())
  })
  it('returns just(ok()) if user is a member and workspace has no SSO provider', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () => err(WorkspaceSsoProviderNotFoundError),
      getWorkspaceSsoSession: async () => err(WorkspaceSsoSessionNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(just(ok()))
  })
  it('throws uncovered error for unexpected ssoProvider loader errors', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      // @ts-expect-error testing uncovered errors
      getWorkspaceSsoProvider: async () => err(ProjectNotFoundError),
      getWorkspaceSsoSession: async () => err(WorkspaceSsoSessionNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).rejects.toThrowError(/Uncovered error/)
  })
  it('throws uncovered error for unexpected ssoSession loader errors', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      // @ts-expect-error testing uncovered errors
      getWorkspaceSsoSession: async () => err(ProjectNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).rejects.toThrowError(/Uncovered error/)
  })
  it('returns WorkspaceSsoSessionInvalidError if user does not have an SSO session', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      getWorkspaceSsoSession: async () => err(WorkspaceSsoSessionNotFoundError)
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).resolves.toStrictEqual(
      just(err(WorkspaceSsoSessionInvalidError))
    )
  })
  it('returns WorkspaceSsoSessionInvalidError if user has an expired sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() - 1)

    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      getWorkspaceSsoSession: async () => ok({ providerId, validUntil, userId })
    })({
      userId,
      workspaceId
    })
    expect(result).toStrictEqual(just(err(WorkspaceSsoSessionInvalidError)))
  })
  it('returns true if user has a valid sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 100)

    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      getWorkspaceSsoSession: async () => ok({ providerId, validUntil, userId })
    })({
      userId,
      workspaceId
    })
    expect(result).toStrictEqual(just(ok()))
  })
})
