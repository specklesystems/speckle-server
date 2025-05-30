import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { WorkspacePlan } from '../../../workspaces/index.js'
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

const buildCanReadMemberEmailPolicy = (
  overrides?: Partial<Parameters<typeof canReadMemberEmailPolicy>[0]>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canReadMemberEmailPolicy({
    getEnv: async () =>
      parseFeatureFlags({
        FF_WORKSPACES_MODULE_ENABLED: 'true'
      }),
    getServerRole: async () => Roles.Server.Admin,
    getWorkspace: async () => {
      return {
        id: workspaceId,
        slug: cryptoRandomString({ length: 9 })
      } as Workspace
    },
    getWorkspaceRole: async () => Roles.Workspace.Admin,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    getWorkspacePlan: async () => {
      return {
        workspaceId,
        name: 'unlimited',
        status: 'valid',
        createdAt: new Date()
      } as WorkspacePlan
    },
    ...overrides
  })
}

const getPolicyArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  workspaceId: cryptoRandomString({ length: 9 })
})

describe('canReadMemberEmailPolicy', () => {
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
