import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import {
  getProjectFake,
  getWorkspaceFake,
  getWorkspacePlanFake
} from '../../../../tests/fakes.js'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { canCreateSavedViewPolicy } from './canCreate.js'
import { TIME_MS } from '../../../../core/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError,
  WorkspaceNoAccessError,
  WorkspaceReadOnlyError
} from '../../../domain/authErrors.js'
import { WorkspacePlans } from '../../../../workspaces/index.js'

const buildSUT = (overrides?: OverridesOf<typeof canCreateSavedViewPolicy>) =>
  canCreateSavedViewPolicy({
    getProject: getProjectFake({
      id: 'project-id'
    }),
    getEnv: async () =>
      parseFeatureFlags({
        FF_SAVED_VIEWS_ENABLED: 'true'
      }),
    getServerRole: async () => Roles.Server.User,
    getWorkspaceRole: async () => null,
    getWorkspace: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    getWorkspacePlan: async () => null,
    getProjectRole: async () => Roles.Stream.Contributor,
    ...overrides
  })

describe('canCreateSavedViewPolicy', () => {
  it('fails when not workspaced project', async () => {
    const canCreate = buildSUT()

    const result = await canCreate({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
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
            FF_WORKSPACES_MODULE_ENABLED: 'true',
            FF_SAVED_VIEWS_ENABLED: 'true'
          }),
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null,
        getWorkspace: getWorkspaceFake({
          id: 'workspace-id'
        }),
        getWorkspacePlan: getWorkspacePlanFake({
          name: WorkspacePlans.Pro
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

    it('succeeds for project contributor', async () => {
      const canCreate = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Contributor
      })

      const result = await canCreate({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeOKResult()
    })

    it('fails if not contributor+', async () => {
      const canCreate = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
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
      const canCreate = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
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
      const canCreate = buildWorkspaceSUT({
        getWorkspaceRole: async () => null,
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

    it('succeeds even on free plan', async () => {
      const canCreate = buildWorkspaceSUT({
        getWorkspacePlan: getWorkspacePlanFake({
          name: WorkspacePlans.Free
        })
      })

      const result = await canCreate({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('fails if workspace readonly', async () => {
      const canCreate = buildWorkspaceSUT({
        getWorkspacePlan: getWorkspacePlanFake({
          name: WorkspacePlans.Pro,
          status: 'canceled'
        })
      })

      const result = await canCreate({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceReadOnlyError.code
      })
    })
  })
})
