import { describe, expect, it } from 'vitest'
import { canReceiveWorkspaceProjectsUpdatedMessagePolicy } from './canReceiveProjectsUpdatedMessage.js'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { Roles } from '../../../core/constants.js'
import { TIME_MS } from '../../../core/index.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import {
  ProjectNotEnoughPermissionsError,
  ServerNoSessionError,
  WorkspaceNoAccessError
} from '../../domain/authErrors.js'
import { ProjectVisibility } from '../../domain/projects/types.js'

describe('canReceiveWorkspaceProjectsUpdatedMessagePolicy', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof canReceiveWorkspaceProjectsUpdatedMessagePolicy>
  ) =>
    canReceiveWorkspaceProjectsUpdatedMessagePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id',
        visibility: ProjectVisibility.Public
      }),
      getProjectRole: async () => Roles.Stream.Reviewer,
      getServerRole: async () => Roles.Server.Guest,
      getWorkspace: getWorkspaceFake({ id: 'workspace-id', slug: 'workspace-slug' }),
      getWorkspaceRole: async () => Roles.Workspace.Guest,
      getWorkspaceSsoProvider: async () => ({
        providerId: 'provider-id'
      }),
      getWorkspaceSsoSession: async () => ({
        userId: 'user-id',
        providerId: 'provider-id',
        validUntil: new Date(Date.now() + TIME_MS.day)
      }),
      getAdminOverrideEnabled: async () => false,
      ...overrides
    })

  it('succeeds if project no longer exists', async () => {
    const sut = buildSUT({
      getProject: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthOKResult()
  })

  it('succeeds for explicit project member', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if not an explicit project member, even on public project', async () => {
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
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('fails if not logged in, even if public project', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Public
      }),
      getServerRole: async () => null
    })

    const result = await sut({
      userId: undefined,
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('succeeds if not explicit project member, as long as not guest', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null,
      getWorkspaceRole: async () => Roles.Workspace.Admin
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails without workspace role', async () => {
    const sut = buildSUT({
      getWorkspaceRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('fails (outside of delete) if no explicit project role and workspace guest', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null,
      getWorkspaceRole: async () => Roles.Workspace.Guest
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      workspaceId: 'workspace-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })
})
