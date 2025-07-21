import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { canCreateSavedViewPolicy } from './canCreate.js'
import { TIME_MS } from '../../../../core/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError
} from '../../../domain/authErrors.js'

const buildSUT = (overrides?: OverridesOf<typeof canCreateSavedViewPolicy>) =>
  canCreateSavedViewPolicy({
    getProject: getProjectFake({
      id: 'project-id'
    }),
    getEnv: async () => parseFeatureFlags({}),
    getServerRole: async () => Roles.Server.User,
    getWorkspaceRole: async () => null,
    getWorkspace: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    getProjectRole: async () => Roles.Stream.Contributor,
    ...overrides
  })

describe('canCreateSavedViewPolicy', () => {
  it('succeeds for project contributor', async () => {
    const canCreate = buildSUT()

    const result = await canCreate({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeOKResult()
  })

  it('fails if not contributor+', async () => {
    const canCreate = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })

    const result = await canCreate({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('fails if no project access', async () => {
    const canCreate = buildSUT({
      getProjectRole: async () => null
    })

    const result = await canCreate({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if logged out', async () => {
    const canCreate = buildSUT({
      getServerRole: async () => null,
      getProjectRole: async () => null
    })

    const result = await canCreate({
      userId: 'aaa',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  describe('w/ workspaces', () => {
    const buildWorkspaceSUT = (
      overrides?: OverridesOf<typeof canCreateSavedViewPolicy>
    ) =>
      buildSUT({
        getProject: getProjectFake({
          id: 'project-id',
          workspaceId: 'workspace-id'
        }),
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null,
        getWorkspace: getWorkspaceFake({
          id: 'workspace-id'
        }),
        getWorkspaceSsoProvider: async () => ({
          providerId: 'provider-id'
        }),
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() + TIME_MS.day)
        }),
        ...overrides
      })

    it('succeeds for workspace admin', async () => {
      const canCreate = buildWorkspaceSUT()

      const result = await canCreate({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeOKResult()
    })
  })
})
