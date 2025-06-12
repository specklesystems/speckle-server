import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canBroadcastProjectActivityPolicy } from './canBroadcastActivity.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { Roles } from '../../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { TIME_MS } from '../../../core/helpers/timeConstants.js'
import { ProjectVisibility } from '../../domain/projects/types.js'

describe('canBroadcastProjectActivityPolicy', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof canBroadcastProjectActivityPolicy>
  ) =>
    canBroadcastProjectActivityPolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true'
        }),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getAdminOverrideEnabled: async () => false,
      getProjectRole: async () => Roles.Stream.Reviewer,
      getServerRole: async () => Roles.Server.User,
      getWorkspace: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof canBroadcastProjectActivityPolicy>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id',
        visibility: ProjectVisibility.Workspace
      }),
      getProjectRole: async () => null,
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

  it('succeeds w/ project role', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('succeeds w/o project role if public', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Public
      }),
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('fails if user undefined', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: undefined,
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('fails if user not found', async () => {
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

  it('fails if project not found', async () => {
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

  it('fails if user has no project role', async () => {
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

  it('succeeds w/ admin override, even w/o project role', async () => {
    const sut = buildSUT({
      getAdminOverrideEnabled: async () => true,
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  describe('with workspace project', async () => {
    it('succeeds w/ workspace role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('succeeds w/o project & workspace role if public', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => null,
        getProjectRole: async () => null,
        getProject: getProjectFake({
          id: 'project-id',
          workspaceId: 'workspace-id',
          visibility: ProjectVisibility.Public
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o workspace role, even if has project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Reviewer,
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code,
        message: /You do not have access to this project's workspace/i
      })
    })

    it('fails if user has no implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds w/o sso, if not needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o sso, if needed', async () => {
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

    it('fails if sso expired', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() - TIME_MS.second)
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
