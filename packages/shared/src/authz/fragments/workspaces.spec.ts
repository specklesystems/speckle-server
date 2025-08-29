import { describe, expect, it } from 'vitest'
import {
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment,
  ensureUserIsWorkspaceAdminFragment,
  ensureCanUseWorkspacePlanFeatureFragment
} from './workspaces.js'
import cryptoRandomString from 'crypto-random-string'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { OverridesOf } from '../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../environment/index.js'
import { Roles } from '../../core/constants.js'
import {
  getEnvFake,
  getWorkspaceFake,
  getWorkspacePlanFake
} from '../../tests/fakes.js'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  WorkspacePlanFeatures
} from '../../workspaces/index.js'

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
      getWorkspace: getWorkspaceFake({
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
      getWorkspace: getWorkspaceFake({
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
      getWorkspace: getWorkspaceFake({
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
      getWorkspace: getWorkspaceFake({
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
      getWorkspace: getWorkspaceFake({
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
      getWorkspace: getWorkspaceFake({
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

describe('ensureUserIsWorkspaceAdminFragment', () => {
  const buildEnsureUserIsWorkspaAdminFragment = (
    overrides?: Partial<Parameters<typeof ensureUserIsWorkspaceAdminFragment>[0]>
  ) => {
    const workspaceId = cryptoRandomString({ length: 9 })

    return ensureUserIsWorkspaceAdminFragment({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true'
        }),
      getServerRole: async () => Roles.Server.Admin,
      getWorkspace: getWorkspaceFake({
        id: workspaceId,
        slug: cryptoRandomString({ length: 9 })
      }),
      getWorkspaceRole: async () => Roles.Workspace.Admin,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspacePlan: getWorkspacePlanFake({ workspaceId }),
      ...overrides
    })
  }

  const getPolicyArgs = () => ({
    userId: cryptoRandomString({ length: 9 }),
    workspaceId: cryptoRandomString({ length: 9 })
  })
  it('returns error if workspaces is not enabled', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment({
      getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' })
    })

    const result = await policy({
      ...getPolicyArgs(),
      userId: undefined
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspacesNotEnabledError.code
    })
  })
  it('returns error if user is not logged in', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment()

    const result = await policy({
      ...getPolicyArgs(),
      userId: undefined
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment({
      getServerRole: async () => null
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace does not exist', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment({
      getWorkspace: async () => null
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('returns error if user is not workspace admin', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment({
      getWorkspaceRole: async () => Roles.Workspace.Member
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNotEnoughPermissionsError.code
    })
  })

  it('returns ok if user is workspace admin', async () => {
    const policy = buildEnsureUserIsWorkspaAdminFragment()

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthOKResult()
  })
})

describe('ensureCanUseWorkspacePlanFeatureFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureCanUseWorkspacePlanFeatureFragment>
  ) =>
    ensureCanUseWorkspacePlanFeatureFragment({
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: true,
        FF_SAVED_VIEWS_ENABLED: true
      }),
      getWorkspacePlan: getWorkspacePlanFake({
        name: PaidWorkspacePlans.Pro,
        status: PaidWorkspacePlanStatuses.Valid
      }),
      ...overrides
    })

  it('succeeds w/ valid workspace w/ feature access', async () => {
    const sut = buildSUT()

    const result = await sut({
      workspaceId: cryptoRandomString({ length: 10 }),
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeOKResult()
  })

  it('fails if workspaces disabled', async () => {
    const sut = buildSUT({
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: false
      })
    })

    const result = await sut({
      workspaceId: cryptoRandomString({ length: 10 }),
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspacesNotEnabledError.code
    })
  })

  it('fails if workspace plan readonly', async () => {
    const sut = buildSUT({
      getWorkspacePlan: getWorkspacePlanFake({
        name: PaidWorkspacePlans.Pro,
        status: PaidWorkspacePlanStatuses.Canceled
      })
    })

    const result = await sut({
      workspaceId: cryptoRandomString({ length: 10 }),
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceReadOnlyError.code
    })
  })

  it('fails w/o plan', async () => {
    const sut = buildSUT({
      getWorkspacePlan: async () => null
    })

    const result = await sut({
      workspaceId: cryptoRandomString({ length: 10 }),
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('it fails if plan doesnt have access to feature', async () => {
    const sut = buildSUT({
      getWorkspacePlan: getWorkspacePlanFake({
        name: PaidWorkspacePlans.Team,
        status: PaidWorkspacePlanStatuses.Valid
      })
    })

    const result = await sut({
      workspaceId: cryptoRandomString({ length: 10 }),
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
})
