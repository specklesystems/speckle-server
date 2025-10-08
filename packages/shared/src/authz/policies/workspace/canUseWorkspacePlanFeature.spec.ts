import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { canUseWorkspacePlanFeature } from './canUseWorkspacePlanFeature.js'
import {
  WorkspaceFeatureFlags,
  WorkspacePlanFeatures
} from '../../../workspaces/index.js'
import { describe, expect, it } from 'vitest'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError
} from '../../domain/authErrors.js'
import { getWorkspacePlanFake } from '../../../tests/fakes.js'

const buildSUT = (
  overrides?: Partial<Parameters<typeof canUseWorkspacePlanFeature>[0]>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canUseWorkspacePlanFeature({
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
    getWorkspacePlan: getWorkspacePlanFake({ workspaceId, name: 'unlimited' }),
    ...overrides
  })
}

const getPolicyArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  workspaceId: cryptoRandomString({ length: 9 }),
  feature: WorkspacePlanFeatures.HideSpeckleBranding
})

describe('canUseFeature', () => {
  it('returns error if user is not logged in', async () => {
    const canUseFeature = buildSUT()

    const result = await canUseFeature({
      ...getPolicyArgs(),
      userId: undefined
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const canUseFeature = buildSUT({
      getServerRole: async () => null
    })

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const canUseFeature = buildSUT({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace does not exist', async () => {
    const canUseFeature = buildSUT({
      getWorkspace: async () => null
    })

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('returns error if user is not workspace admin', async () => {
    const canUseFeature = buildSUT({
      getWorkspaceRole: async () => Roles.Workspace.Member
    })

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNotEnoughPermissionsError.code
    })
  })

  it('returns error if workspace is read only', async () => {
    const canUseFeature = buildSUT({
      getWorkspacePlan: async () => ({
        workspaceId: cryptoRandomString({ length: 9 }),
        name: 'proUnlimited',
        status: 'canceled',
        createdAt: new Date(),
        updatedAt: new Date(),
        featureFlags: WorkspaceFeatureFlags.none
      })
    })

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceReadOnlyError.code
    })
  })

  it('returns error if workspace plan does not have access to the feature', async () => {
    const canUseFeature = buildSUT({
      getWorkspacePlan: async () => ({
        workspaceId: cryptoRandomString({ length: 9 }),
        name: 'free',
        status: 'valid',
        createdAt: new Date(),
        updatedAt: new Date(),
        featureFlags: WorkspaceFeatureFlags.none
      })
    })

    const result = await canUseFeature({
      ...getPolicyArgs(),
      feature: WorkspacePlanFeatures.CustomDataRegion
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })

  it('returns ok if workspace plan has access to the feature', async () => {
    const canUseFeature = buildSUT()

    const result = await canUseFeature(getPolicyArgs())

    expect(result).toBeAuthOKResult()
  })
})
