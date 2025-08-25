import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import {
  getProjectFake,
  getWorkspaceFake,
  getWorkspacePlanFake
} from '../../../tests/fakes.js'
import { canUpdateEmbedTokensPolicy } from './canUpdateEmbedTokens.js'
import { assert, describe, expect, it } from 'vitest'
import {
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError,
  WorkspacePlanNoFeatureAccessError
} from '../../domain/authErrors.js'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { WorkspaceFeatureFlags } from '../../../workspaces/index.js'

const buildCanUpdateEmbedTokens = (
  overrides?: OverridesOf<typeof canUpdateEmbedTokensPolicy>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canUpdateEmbedTokensPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getServerRole: async () => {
      return Roles.Server.User
    },
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId
    }),
    getProjectRole: async () => {
      return Roles.Stream.Owner
    },
    getWorkspace: getWorkspaceFake({
      id: workspaceId
    }),
    getWorkspaceRole: async () => {
      return Roles.Workspace.Admin
    },
    getWorkspaceSsoProvider: async () => {
      return null
    },
    getWorkspaceSsoSession: async () => {
      assert.fail()
    },
    getWorkspacePlan: getWorkspacePlanFake({ workspaceId }),
    ...overrides
  })
}

const canUpdateEmbedTokensArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canUpdateEmbedTokensArgs returns a function, that', () => {
  it('requires a user session', async () => {
    const result = await buildCanUpdateEmbedTokens({
      getServerRole: async () => {
        return null
      }
    })(canUpdateEmbedTokensArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })
  it('requires user to be project owner', async () => {
    const result = await buildCanUpdateEmbedTokens({
      getWorkspaceRole: async () => {
        return Roles.Workspace.Member
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      }
    })(canUpdateEmbedTokensArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })
  it('does not check workspace plan if workspaces not enabled', async () => {
    const result = await buildCanUpdateEmbedTokens({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        }),
      getWorkspacePlan: async () => {
        assert.fail()
      }
    })(canUpdateEmbedTokensArgs())

    expect(result).toBeAuthOKResult()
  })
  it('does not check workspace plan if project is not in a workspace', async () => {
    const result = await buildCanUpdateEmbedTokens({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getWorkspacePlan: async () => {
        assert.fail()
      }
    })(canUpdateEmbedTokensArgs())

    expect(result).toBeAuthOKResult()
  })
  it('requires a paid workspace plan, if project is in a workspace', async () => {
    const result = await buildCanUpdateEmbedTokens({
      getWorkspacePlan: async () => {
        return {
          status: 'valid',
          workspaceId: 'foo',
          name: 'free',
          createdAt: new Date(),
          updatedAt: new Date(),
          featureFlags: WorkspaceFeatureFlags.none
        }
      }
    })(canUpdateEmbedTokensArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
  it('allows action on paid workspace plans', async () => {
    const result = await buildCanUpdateEmbedTokens()(canUpdateEmbedTokensArgs())
    expect(result).toBeAuthOKResult()
  })
})
