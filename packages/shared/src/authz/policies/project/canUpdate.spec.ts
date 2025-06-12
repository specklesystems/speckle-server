import { describe, expect, it } from 'vitest'
import { Roles } from '../../../core/constants.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { canUpdateProjectPolicy } from './canUpdate.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { TIME_MS } from '../../../core/index.js'

// Default deps allow test to succeed, this makes it so that we need to override less of them
const buildSUT = (overrides?: Partial<Parameters<typeof canUpdateProjectPolicy>[0]>) =>
  canUpdateProjectPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: null
    }),
    getProjectRole: async () => Roles.Stream.Owner,
    getServerRole: async () => Roles.Server.User,
    getWorkspace: async () => null,
    getWorkspaceRole: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    ...overrides
  })

const buildWorkspaceSUT = (
  overrides?: Partial<Parameters<typeof canUpdateProjectPolicy>[0]>
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
    getWorkspaceSsoSession: async () => {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 7)
      return {
        userId: 'user-id',
        providerId: 'provider-id',
        validUntil
      }
    },
    ...overrides
  })

describe('canUpdateProject', () => {
  it('returns error if user is not logged in', async () => {
    const canUpdateProject = buildSUT()

    const result = await canUpdateProject({
      userId: undefined,
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const canUpdateProject = buildSUT({
      getServerRole: async () => null
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const canUpdateProject = buildSUT({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error project not found', async () => {
    const canUpdateProject = buildSUT({
      getProject: async () => null
    })

    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns error if no role at all', async () => {
    const canUpdateProject = buildSUT({
      getProjectRole: async () => null
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('returns error if not owner', async () => {
    const canUpdateProject = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns ok if permissible', async () => {
    const canUpdateProject = buildSUT()
    const result = await canUpdateProject({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    it('returns ok if permissible', async () => {
      const canUpdateProject = buildWorkspaceSUT()
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns ok with implicit owner role', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no workspace role, even w/ valid project role', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => null,
        getProjectRole: async () => Roles.Stream.Owner
      })

      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('returns error if invalid workspace and project role', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Contributor
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id'
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
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no sso session', async () => {
      const canUpdateProject = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })
      const result = await canUpdateProject({
        userId: 'user-id',
        projectId: 'project-id'
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
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
