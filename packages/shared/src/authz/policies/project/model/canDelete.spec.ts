import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import {
  getModelFake,
  getProjectFake,
  getWorkspaceFake
} from '../../../../tests/fakes.js'
import {
  ModelNotFoundError,
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ReservedModelNotDeletableError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { canDeleteModelPolicy } from './canDelete.js'
import { TIME_MS } from '../../../../core/helpers/timeConstants.js'

const buildSUT = (overrides?: Partial<Parameters<typeof canDeleteModelPolicy>[0]>) =>
  canDeleteModelPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: null
    }),
    getModel: getModelFake({
      id: 'model-id',
      projectId: 'project-id',
      authorId: 'user-id',
      name: 'model-name'
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
  overrides?: Partial<Parameters<typeof canDeleteModelPolicy>[0]>
) =>
  buildSUT({
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: 'workspace-id'
    }),
    getWorkspace: getWorkspaceFake({
      id: 'workspace-id',
      slug: 'workspace-slug'
    }),
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

describe('canDeleteModelPolicy', () => {
  it('returns error if user is not logged in', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: undefined,
      projectId: 'project-id',
      modelId: 'model-id'
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
      projectId: 'project-id',
      modelId: 'model-id'
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
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns error if model not found', async () => {
    const sut = buildSUT({
      getModel: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ModelNotFoundError.code
    })
  })

  it('returns error if model is reserved', async () => {
    const sut = buildSUT({
      getModel: getModelFake({
        id: 'model-id',
        projectId: 'project-id',
        name: 'main',
        authorId: 'user-id'
      })
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'main'
    })

    expect(result).toBeAuthErrorResult({
      code: ReservedModelNotDeletableError.code
    })
  })

  it('returns error if user is not author and not project owner', async () => {
    const sut = buildSUT({
      getModel: getModelFake({
        id: 'model-id',
        projectId: 'project-id',
        authorId: 'other-user-id'
      }),
      getProjectRole: async () => Roles.Stream.Contributor
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns error if no project role at all', async () => {
    const sut = buildSUT({
      getModel: getModelFake({
        id: 'model-id',
        projectId: 'project-id',
        authorId: 'other-user-id'
      }),
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
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
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns ok if permissible', async () => {
    const sut = buildSUT()
    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthOKResult()
  })

  it('returns ok if not author, but project owner', async () => {
    const sut = buildSUT({
      getModel: getModelFake({
        id: 'model-id',
        projectId: 'project-id',
        authorId: 'other-user-id'
      }),
      getProjectRole: async () => Roles.Stream.Owner
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthOKResult()
  })

  it('returns ok if no author, but project owner', async () => {
    const sut = buildSUT({
      getModel: getModelFake({
        id: 'model-id',
        projectId: 'project-id',
        authorId: null
      }),
      getProjectRole: async () => Roles.Stream.Owner
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      modelId: 'model-id'
    })
    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    it('returns ok if permissible', async () => {
      const sut = buildWorkspaceSUT()
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        modelId: 'model-id'
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
        projectId: 'project-id',
        modelId: 'model-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Reviewer
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        modelId: 'model-id'
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
        projectId: 'project-id',
        modelId: 'model-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no sso session', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })
      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        modelId: 'model-id'
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
        projectId: 'project-id',
        modelId: 'model-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
