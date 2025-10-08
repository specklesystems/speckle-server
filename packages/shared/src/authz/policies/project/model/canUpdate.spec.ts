import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { canUpdateModelPolicy } from './canUpdate.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { TIME_MS } from '../../../../core/helpers/timeConstants.js'

const buildSUT = (overrides?: Partial<Parameters<typeof canUpdateModelPolicy>[0]>) =>
  canUpdateModelPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: null
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
  overrides?: Partial<Parameters<typeof canUpdateModelPolicy>[0]>
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

describe('canUpdateProject', () => {
  it('returns error if user is not logged in', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: undefined,
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user not found', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if project not found', async () => {
    const sut = buildSUT({
      getProject: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns error if no project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })
    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('returns error if not at least contributor', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })
    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns ok if permissible', async () => {
    const sut = buildSUT()
    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    it('returns ok if permissible', async () => {
      const sut = buildWorkspaceSUT()
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns ok with implicit owner role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if invalid workspace and project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Reviewer
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('returns ok if no sso configured', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no sso session', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('returns error if sso expired', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(new Date().getTime() - TIME_MS.second)
        })
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
