import cryptoRandomString from 'crypto-random-string'
import { canReadEmbedTokensPolicy } from './canReadEmbedTokens.js'
import { Roles } from '../../../../core/constants.js'
import { assert, describe, expect, it } from 'vitest'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { ProjectNoAccessError } from '../../../domain/authErrors.js'

const buildCanReadEmbedTokens = (
  overrides?: Partial<Parameters<typeof canReadEmbedTokensPolicy>[0]>
) => {
  const workspaceId = cryptoRandomString({ length: 9 })

  return canReadEmbedTokensPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getAdminOverrideEnabled: async () => false,
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId
    }),
    getProjectRole: async () => {
      return Roles.Stream.Reviewer
    },
    getServerRole: async () => {
      return Roles.Server.User
    },
    getWorkspaceRole: async () => {
      return Roles.Workspace.Member
    },
    getWorkspace: getWorkspaceFake({
      id: workspaceId
    }),
    getWorkspaceSsoProvider: async () => {
      return null
    },
    getWorkspaceSsoSession: async () => {
      assert.fail()
    },
    ...overrides
  })
}

const canReadEmbedTokensArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canReadEmbedTokensPolicy returns a function, that', () => {
  it('fails on users without project role', async () => {
    const result = await buildCanReadEmbedTokens({
      getProjectRole: async () => null,
      getWorkspaceRole: async () => null
    })(canReadEmbedTokensArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })
  it('allows users with read access', async () => {
    const result = await buildCanReadEmbedTokens()(canReadEmbedTokensArgs())
    expect(result).toBeAuthOKResult()
  })
})
