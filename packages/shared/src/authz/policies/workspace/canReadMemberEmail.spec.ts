import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import { describe, expect, it } from 'vitest'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacesNotEnabledError
} from '../../domain/authErrors.js'
import { canReadMemberEmailPolicy } from './canReadMemberEmail.js'
import { getWorkspaceFake, getWorkspacePlanFake } from '../../../tests/fakes.js'

describe('canReadMemberEmailPolicy', () => {
  const workspaceId = cryptoRandomString({ length: 9 })

  const buildCanReadMemberEmailPolicy = (
    overrides?: Partial<Parameters<typeof canReadMemberEmailPolicy>[0]>
  ) => {
    return canReadMemberEmailPolicy({
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
    workspaceId
  })
  it('returns error if workspaces is not enabled', async () => {
    const policy = buildCanReadMemberEmailPolicy({
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
    const policy = buildCanReadMemberEmailPolicy()

    const result = await policy({
      ...getPolicyArgs(),
      userId: undefined
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const policy = buildCanReadMemberEmailPolicy({
      getServerRole: async () => null
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const policy = buildCanReadMemberEmailPolicy({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace does not exist', async () => {
    const policy = buildCanReadMemberEmailPolicy({
      getWorkspace: async () => null
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('returns error if user is not workspace admin', async () => {
    const policy = buildCanReadMemberEmailPolicy({
      getWorkspaceRole: async () => Roles.Workspace.Member
    })

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNotEnoughPermissionsError.code
    })
  })

  it('returns ok if user is workspace admin', async () => {
    const policy = buildCanReadMemberEmailPolicy()

    const result = await policy(getPolicyArgs())

    expect(result).toBeAuthOKResult()
  })
})
