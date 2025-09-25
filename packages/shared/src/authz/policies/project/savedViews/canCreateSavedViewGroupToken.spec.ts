import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import {
  getEnvFake,
  getProjectFake,
  getSavedViewGroupFake,
  getWorkspaceFake,
  getWorkspacePlanFake,
  getWorkspaceSsoProviderFake,
  getWorkspaceSsoSessionFake
} from '../../../../tests/fakes.js'
import { Roles } from '../../../../core/constants.js'
import {
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError,
  UngroupedSavedViewGroupLockError,
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError,
  WorkspacesNotEnabledError
} from '../../../domain/authErrors.js'
import { canCreateSavedViewGroupTokenPolicy } from './canCreateSavedViewGroupToken.js'

describe('canCreateSavedViewGroupTokenPolicy', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof canCreateSavedViewGroupTokenPolicy>
  ) =>
    canCreateSavedViewGroupTokenPolicy({
      getSavedViewGroup: getSavedViewGroupFake({
        projectId: 'project-id'
      }),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: true,
        FF_SAVED_VIEWS_ENABLED: true
      }),
      getServerRole: async () => Roles.Server.User,
      getProjectRole: async () => Roles.Stream.Owner,
      getWorkspaceRole: async () => null,
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspacePlan: async () => null,
      getWorkspaceSsoSession: async () => null,
      ...overrides
    })

  it('fails in non-workspaced project, even if project owner', async () => {
    const policy = buildSUT()

    const result = await policy({
      userId: 'user-id',
      projectId: 'project-id',
      savedViewGroupId: 'saved-group-id'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  describe('w/ workspaced project', async () => {
    const buildWorkspacedSUT = (
      overrides?: OverridesOf<typeof canCreateSavedViewGroupTokenPolicy>
    ) =>
      buildSUT({
        getProject: getProjectFake({
          id: 'project-id',
          workspaceId: 'workspace-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspace: getWorkspaceFake({
          id: 'workspace-id'
        }),
        getWorkspacePlan: getWorkspacePlanFake({
          workspaceId: 'workspace-id',
          name: 'pro'
        }),
        getWorkspaceSsoProvider: getWorkspaceSsoProviderFake({
          providerId: 'sso-provider-id'
        }),
        getWorkspaceSsoSession: getWorkspaceSsoSessionFake({
          providerId: 'sso-provider-id'
        }),
        ...overrides
      })

    it('works if user is project owner', async () => {
      const sut = buildWorkspacedSUT()

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails if workspaces disabled', async () => {
      const sut = buildWorkspacedSUT({
        getEnv: getEnvFake({
          FF_WORKSPACES_MODULE_ENABLED: false,
          FF_SAVED_VIEWS_ENABLED: true
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspacesNotEnabledError.code
      })
    })

    it('fails if saved views disabled', async () => {
      const sut = buildWorkspacedSUT({
        getEnv: getEnvFake({
          FF_WORKSPACES_MODULE_ENABLED: true,
          FF_SAVED_VIEWS_ENABLED: false
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspacePlanNoFeatureAccessError.code
      })
    })

    it('fails if just reviewer', async () => {
      const sut = buildWorkspacedSUT({
        getProjectRole: async () => Roles.Stream.Reviewer
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('fails if logged out', async () => {
      const sut = buildWorkspacedSUT({
        getWorkspaceRole: async () => null,
        getServerRole: async () => null,
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'aaa',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })
      expect(result).toBeAuthErrorResult({
        code: ServerNoAccessError.code
      })
    })

    it('fails if not owner and not the author', async () => {
      const sut = buildWorkspacedSUT({
        getSavedViewGroup: getSavedViewGroupFake({
          projectId: 'project-id',
          authorId: 'another-user-id'
        }),
        getProjectRole: async () => Roles.Stream.Contributor
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('fails if updating default group', async () => {
      const sut = buildWorkspacedSUT({
        getSavedViewGroup: getSavedViewGroupFake({
          projectId: 'project-id',
          id: 'default-XXX'
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'default-XXX'
      })

      expect(result).toBeAuthErrorResult({
        code: UngroupedSavedViewGroupLockError.code
      })
    })

    it('succeeds if not owner but author', async () => {
      const sut = buildWorkspacedSUT({
        getSavedViewGroup: getSavedViewGroupFake({
          projectId: 'project-id',
          authorId: 'user-id'
        }),
        getProjectRole: async () => Roles.Stream.Contributor
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'saved-group-id'
      })

      expect(result).toBeOKResult()
    })
  })
})
