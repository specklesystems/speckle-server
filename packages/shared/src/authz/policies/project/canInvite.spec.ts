import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canInviteToProjectPolicy } from './canInvite.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import { getProjectFake } from '../../../tests/fakes.js'
import { PersonalProjectsLimitedError } from '../../domain/authErrors.js'

const buildSUT = (overrides?: OverridesOf<typeof canInviteToProjectPolicy>) =>
  canInviteToProjectPolicy({
    getEnv: async () =>
      parseFeatureFlags({
        FF_PERSONAL_PROJECTS_LIMITS_ENABLED: 'false',
        FF_WORKSPACES_MODULE_ENABLED: 'true'
      }),
    getServerRole: async () => Roles.Server.User,
    getProject: getProjectFake({
      id: 'project-id'
    }),
    getProjectRole: async () => Roles.Stream.Owner,
    getWorkspace: async () => null,
    getWorkspaceRole: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    ...(overrides || {})
  })

describe('canInviteToProjectPolicy', () => {
  it('succeeds for project owner', async () => {
    const canInvite = buildSUT()

    const result = await canInvite({ userId: 'user-id', projectId: 'project-id' })
    expect(result).toBeOKResult()
  })

  it('fails if personal projects are disabled', async () => {
    const canInvite = buildSUT({
      getEnv: async () =>
        parseFeatureFlags({
          FF_PERSONAL_PROJECTS_LIMITS_ENABLED: 'true'
        })
    })

    const result = await canInvite({ userId: 'user-id', projectId: 'project-id' })
    expect(result).toBeAuthErrorResult({
      code: PersonalProjectsLimitedError.code
    })
  })
})
