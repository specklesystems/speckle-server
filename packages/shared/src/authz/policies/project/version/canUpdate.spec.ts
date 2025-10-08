import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import {
  getProjectFake,
  getVersionFake,
  getWorkspaceFake
} from '../../../../tests/fakes.js'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { canUpdateProjectVersionPolicy } from './canUpdate.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  VersionNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { TIME_MS } from '../../../../core/helpers/timeConstants.js'

// Default deps allow test to succeed, this makes it so that we need to override less of them
const buildSUT = (overrides?: OverridesOf<typeof canUpdateProjectVersionPolicy>) =>
  canUpdateProjectVersionPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: null
    }),
    getVersion: getVersionFake({
      id: 'version-id',
      projectId: 'project-id',
      authorId: 'user-id'
    }),
    getProjectRole: async () => Roles.Stream.Contributor,
    getServerRole: async () => Roles.Server.User,
    getWorkspace: async () => null,
    getWorkspaceRole: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    ...overrides
  })

const buildWorkspaceSUT = (
  overrides?: OverridesOf<typeof canUpdateProjectVersionPolicy>
) =>
  buildSUT({
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: 'workspace-id'
    }),
    getWorkspace: getWorkspaceFake({ id: 'workspace-id', slug: 'workspace-slug' }),
    getWorkspaceRole: async () => Roles.Workspace.Member,
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

describe('canUpdateProjectVersionPolicy', () => {
  it('returns error if user is not logged in', async () => {
    const canUpdateProject = buildSUT()

    const result = await canUpdateProject({
      userId: undefined,
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user not found', async () => {
    const canUpdateProject = buildSUT({
      getServerRole: async () => null
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error project not found', async () => {
    const canUpdateProject = buildSUT({
      getProject: async () => null
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns error if no project role', async () => {
    const canUpdateProject = buildSUT({
      getProjectRole: async () => null
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('returns error if not at least contributor', async () => {
    const canUpdateProject = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns error if not owner or author', async () => {
    const canUpdateProject = buildSUT({
      getVersion: getVersionFake({
        id: 'version-id',
        projectId: 'project-id',
        authorId: 'not-user-id'
      }),
      getProjectRole: async () => Roles.Stream.Contributor
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns error if version not found', async () => {
    const canUpdateProject = buildSUT({
      getVersion: async () => null
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthErrorResult({
      code: VersionNotFoundError.code
    })
  })

  it('returns ok if author', async () => {
    const canUpdateProject = buildSUT()
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthOKResult()
  })

  it('returns ok if owner and not author', async () => {
    const canUpdateProject = buildSUT({
      getVersion: getVersionFake({
        id: 'version-id',
        projectId: 'project-id',
        authorId: 'not-user-id'
      }),
      getProjectRole: async () => Roles.Stream.Owner
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id',
      versionId: 'version-id'
    })

    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    it('returns ok if permissible', async () => {
      const canUpdateProject = buildWorkspaceSUT()
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })

      expect(result).toBeAuthOKResult()
    })

    it('returns ok with implicit owner role and not author', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null
      })
      const result = await canUpdateProject({
        userId: 'other-user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })

      expect(result).toBeAuthOKResult()
    })

    it('returns error if no workspace role, even if has project role', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => null,
        getProjectRole: async () => Roles.Stream.Owner
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('returns error if no implicit contributor role', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Reviewer
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('returns ok if no sso configured', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no sso session', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('returns error if sso expired', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(new Date().getTime() - TIME_MS.second)
        })
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id',
        versionId: 'version-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
