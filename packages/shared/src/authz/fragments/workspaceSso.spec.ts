import { describe, expect, it } from 'vitest'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from './workspaceSso.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import {
  ProjectNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceNotFoundError,
  WorkspaceRoleNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceSsoSessionNotFoundError
} from '../domain/authErrors.js'
import { just, nothing } from 'true-myth/maybe'

describe('maybeMemberRoleWithValidSsoSessionIfNeeded returns a function, that', () => {
  it.each([new WorkspaceNoAccessError(), new WorkspaceNotFoundError()])(
    'remaps workspace loader error $code into WorkspaceNoAccessError',
    async (expectedError) => {
      const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
        getWorkspace: async () => err(expectedError),
        getWorkspaceRole: async () => err(new WorkspaceRoleNotFoundError()),
        getWorkspaceSsoProvider: async () =>
          err(new WorkspaceSsoProviderNotFoundError()),
        getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 })
      })
      await expect(result).resolves.toStrictEqual(
        just(err(new WorkspaceNoAccessError()))
      )
    }
  )
  it('returns workspace loader error sso error completely', async () => {
    const ssoError = new WorkspaceSsoSessionNoAccessError({
      payload: { workspaceSlug: cryptoRandomString({ length: 10 }) }
    })
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => err(ssoError),
      getWorkspaceRole: async () => err(new WorkspaceRoleNotFoundError()),
      getWorkspaceSsoProvider: async () => err(new WorkspaceSsoProviderNotFoundError()),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).resolves.toStrictEqual(just(err(ssoError)))
  })
  it('throws Uncovered error for unknown loader errors', async () => {
    await expect(
      maybeMemberRoleWithValidSsoSessionIfNeeded({
        // @ts-expect-error testing the unexpected error case here
        getWorkspace: async () => err(new WorkspaceSsoProviderNotFoundError()),
        getWorkspaceRole: async () => err(new WorkspaceRoleNotFoundError()),
        getWorkspaceSsoProvider: async () =>
          err(new WorkspaceSsoProviderNotFoundError()),
        getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 })
      })
    ).rejects.toThrowError(/Uncovered error/)
  })
  it('returns nothing if user does not have a workspace role', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => err(new WorkspaceRoleNotFoundError()),
      getWorkspaceSsoProvider: async () => err(new WorkspaceSsoProviderNotFoundError()),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(nothing())
  })
  it('returns nothing if user does not have a minimum workspace:member role', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:guest'),
      getWorkspaceSsoProvider: async () => err(new WorkspaceSsoProviderNotFoundError()),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(nothing())
  })
  it('returns just(ok()) if user is a member and workspace has no SSO provider', async () => {
    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () => err(new WorkspaceSsoProviderNotFoundError()),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    expect(result).toStrictEqual(just(ok()))
  })
  it('throws uncovered error for unexpected ssoProvider loader errors', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:member'),
      // @ts-expect-error testing uncovered errors
      getWorkspaceSsoProvider: async () => err(new ProjectNotFoundError()),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).rejects.toThrowError(/Uncovered error/)
  })
  it('throws uncovered error for unexpected ssoSession loader errors', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      // @ts-expect-error testing uncovered errors
      getWorkspaceSsoSession: async () => err(new ProjectNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).rejects.toThrowError(/Uncovered error/)
  })
  it('returns WorkspaceSsoSessionInvalidError if user does not have an SSO session', async () => {
    const result = maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError())
    })({
      userId: cryptoRandomString({ length: 10 }),
      workspaceId: cryptoRandomString({ length: 10 })
    })
    await expect(result).resolves.toStrictEqual(
      just(
        err(new WorkspaceSsoSessionNoAccessError({ payload: { workspaceSlug: 'bbb' } }))
      )
    )
  })
  it('returns WorkspaceSsoSessionInvalidError if user has an expired sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() - 1)

    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
      getWorkspaceRole: async () => ok('workspace:member'),
      getWorkspaceSsoProvider: async () =>
        ok({ providerId: cryptoRandomString({ length: 10 }) }),
      getWorkspaceSsoSession: async () => ok({ providerId, validUntil, userId })
    })({
      userId,
      workspaceId
    })
    expect(result).toStrictEqual(
      just(
        err(new WorkspaceSsoSessionNoAccessError({ payload: { workspaceSlug: 'bbb' } }))
      )
    )
  })
  it('returns true if user has a valid sso session', async () => {
    const userId = cryptoRandomString({ length: 10 })
    const providerId = cryptoRandomString({ length: 10 })
    const workspaceId = cryptoRandomString({ length: 10 })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 100)

    const result = await maybeMemberRoleWithValidSsoSessionIfNeeded({
      getWorkspace: async () => {
        return ok({
          id: 'aaa',
          slug: 'bbb'
        })
      },
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
