import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canReadAccIntegrationSettingsPolicy } from './canReadAccIntegrationSettings.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { assert, describe, expect, it } from 'vitest'
import {
  AccIntegrationNotEnabledError,
  ProjectNoAccessError,
  WorkspacePlanNoFeatureAccessError
} from '../../domain/authErrors.js'

const buildSUT = (
  overrides?: OverridesOf<typeof canReadAccIntegrationSettingsPolicy>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canReadAccIntegrationSettingsPolicy({
    getEnv: async () => parseFeatureFlags({ FF_ACC_INTEGRATION_ENABLED: 'true' }),
    getServerRole: async () => {
      return Roles.Server.User
    },
    getAdminOverrideEnabled: async () => {
      return true
    },
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId
    }),
    getProjectRole: async () => {
      return Roles.Stream.Contributor
    },
    getWorkspace: getWorkspaceFake({
      id: workspaceId
    }),
    getWorkspaceRole: async () => {
      return Roles.Workspace.Member
    },
    getWorkspaceSsoProvider: async () => {
      return null
    },
    getWorkspaceSsoSession: async () => {
      assert.fail()
    },
    getWorkspacePlan: async () => {
      return {
        status: 'valid',
        workspaceId,
        name: 'enterprise',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    ...overrides
  })
}

const buildArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canReadAccIntegrationSettings returns a function, that', () => {
  it('requires the ACC integration to be enabled', async () => {
    const result = await buildSUT({
      getEnv: async () => parseFeatureFlags({ FF_ACC_INTEGRATION_ENABLED: 'false' })
    })(buildArgs())

    expect(result).toBeAuthErrorResult({
      code: AccIntegrationNotEnabledError.code
    })
  })
  it('requires the project to belong to a workspace', async () => {
    const result = await buildSUT({
      getProject: getProjectFake({
        id: 'project-id'
      })
    })(buildArgs())

    expect(result).toBeAuthErrorResult({
      code: AccIntegrationNotEnabledError.code
    })
  })
  it('requires the given user to have read access to the project', async () => {
    const result = await buildSUT({
      getProjectRole: async () => null
    })(buildArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })
  it('requires the workspace to have an active plan', async () => {
    const result = await buildSUT({
      getWorkspacePlan: async () => null
    })(buildArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
  it('requires the workspace plan to have access to the ACC integration feature', async () => {
    const result = await buildSUT({
      getWorkspacePlan: async () => {
        return {
          status: 'valid',
          workspaceId: cryptoRandomString({ length: 9 }),
          name: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    })(buildArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
  it('allows enterprise plans to access the ACC integration feature', async () => {
    const result = await buildSUT({})(buildArgs())
    expect(result).toBeAuthOKResult()
  })
})
