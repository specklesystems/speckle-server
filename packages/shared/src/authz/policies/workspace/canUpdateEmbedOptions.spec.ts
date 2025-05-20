import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { canUpdateEmbedOptionsPolicy } from './canUpdateEmbedOptions.js'
import { WorkspacePlan } from '../../../workspaces/index.js'
import { describe, expect, it } from 'vitest'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNoFeatureAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError
} from '../../domain/authErrors.js'

const buildCanUpdateEmbedOptionsPolicy = (
  overrides?: Partial<Parameters<typeof canUpdateEmbedOptionsPolicy>[0]>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canUpdateEmbedOptionsPolicy({
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

describe('canUpdateEmbedOptions', () => {
  it('returns error if user is not logged in', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy()

    const result = await canUpdateEmbedOptions({
      ...getPolicyArgs(),
      userId: undefined
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getServerRole: async () => null
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace does not exist', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getWorkspace: async () => null
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('returns error if user is not workspace admin', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getWorkspaceRole: async () => Roles.Workspace.Member
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace is read only', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getWorkspacePlan: async () => ({
        workspaceId: cryptoRandomString({ length: 9 }),
        name: 'proUnlimited',
        status: 'canceled',
        createdAt: new Date()
      })
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceReadOnlyError.code
    })
  })

  it('returns error if workspace has invalid plan', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy({
      getWorkspacePlan: async () => ({
        workspaceId: cryptoRandomString({ length: 9 }),
        name: 'free',
        status: 'valid',
        createdAt: new Date()
      })
    })

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoFeatureAccessError.code
    })
  })

  it('returns ok if workspace has valid plan', async () => {
    const canUpdateEmbedOptions = buildCanUpdateEmbedOptionsPolicy()

    const result = await canUpdateEmbedOptions(getPolicyArgs())

    expect(result).toBeAuthOKResult()
  })
})
