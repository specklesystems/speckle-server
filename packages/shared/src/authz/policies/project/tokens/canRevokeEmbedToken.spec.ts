import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { canRevokeEmbedTokenPolicy } from './canRevokeEmbedToken.js'
import { assert, describe, expect, it } from 'vitest'
import {
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError,
  WorkspacePlanNoFeatureAccessError
} from '../../../domain/authErrors.js'

const buildCanRevokeEmbedToken = (
  overrides?: Partial<Parameters<typeof canRevokeEmbedTokenPolicy>[0]>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canRevokeEmbedTokenPolicy({
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
    getWorkspacePlan: async () => {
      return {
        status: 'valid',
        workspaceId,
        name: 'unlimited',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    ...overrides
  })
}

const canRevokeEmbedTokenArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canRevokeEmbedTokenArgs returns a function, that', () => {
  it('requires a user session', async () => {
    const result = await buildCanRevokeEmbedToken({
      getServerRole: async () => {
        return null
      }
    })(canRevokeEmbedTokenArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })
  it('requires user to be project owner', async () => {
    const result = await buildCanRevokeEmbedToken({
      getWorkspaceRole: async () => {
        return Roles.Workspace.Member
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      }
    })(canRevokeEmbedTokenArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })
  it('does not check workspace plan if workspaces not enabled', async () => {
    const result = await buildCanRevokeEmbedToken({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        }),
      getWorkspacePlan: async () => {
        assert.fail()
      }
    })(canRevokeEmbedTokenArgs())

    expect(result).toBeAuthOKResult()
  })
  it('does not check workspace plan if project is not in a workspace', async () => {
    const result = await buildCanRevokeEmbedToken({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getWorkspacePlan: async () => {
        assert.fail()
      }
    })(canRevokeEmbedTokenArgs())

    expect(result).toBeAuthOKResult()
  })
  it('requires a paid workspace plan, if project is in a workspace', async () => {
    const result = await buildCanRevokeEmbedToken({
      getWorkspacePlan: async () => {
        return {
          status: 'valid',
          workspaceId: 'foo',
          name: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    })(canRevokeEmbedTokenArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
  it('allows action on paid workspace plans', async () => {
    const result = await buildCanRevokeEmbedToken()(canRevokeEmbedTokenArgs())
    expect(result).toBeAuthOKResult()
  })
})
