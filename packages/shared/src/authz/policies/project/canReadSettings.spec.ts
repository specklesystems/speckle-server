import { describe, expect, it } from 'vitest'
import { canReadProjectSettingsPolicy } from './canReadSettings.js'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import {
  ProjectNoAccessError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { TIME_MS } from '../../../core/helpers/timeConstants.js'
import { ProjectVisibility } from '../../domain/projects/types.js'

describe('canReadProjectSettingsPolicy', () => {
  const buildSUT = (overrides?: OverridesOf<typeof canReadProjectSettingsPolicy>) =>
    canReadProjectSettingsPolicy({
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
    overrides?: OverridesOf<typeof canReadProjectSettingsPolicy>
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

  it('succeeds w/ explicit project role', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('succeeds w/ admin override', async () => {
    const sut = buildSUT({
      getAdminOverrideEnabled: async () => true,
      getProjectRole: async () => null,
      getServerRole: async () => Roles.Server.Admin
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

  it('fails if no project role', async () => {
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

  describe('with workspace project', () => {
    it('succeeds w/ implicit project role', async () => {
      const sut = buildWorkspaceSUT()

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o workspace role role, even w/ project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Contributor,
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('fails w/o workspace & project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
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

    it('succeeds if workspace guest & explicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Reviewer,
        getWorkspaceRole: async () => Roles.Workspace.Guest
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails if workspace guest & no project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
        getWorkspaceRole: async () => Roles.Workspace.Guest
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds if member and no sso required', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceRole: async () => Roles.Workspace.Member
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails if no sso session', async () => {
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

    it('fails if expired sso session', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(0)
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
