import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../tests/helpers/types.js'
import { canLeaveProjectPolicy } from './canLeave.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import {
  ProjectLastOwnerError,
  ProjectNoAccessError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { TIME_MS } from '../../../core/helpers/timeConstants.js'

describe('canLeaveProjectPolicy', () => {
  const buildSUT = (overrides?: OverridesOf<typeof canLeaveProjectPolicy>) =>
    canLeaveProjectPolicy({
      getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getProjectRole: async () => Roles.Stream.Reviewer,
      getServerRole: async () => Roles.Server.Guest,
      getWorkspace: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getProjectRoleCounts: async () => 100,
      ...overrides
    })

  const buildWorkspaceSUT = (overrides?: OverridesOf<typeof canLeaveProjectPolicy>) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id'
      }),
      getProjectRole: async () => Roles.Stream.Reviewer,
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

    const result = await sut({ userId: 'user-id', projectId: 'project-id' })

    expect(result).toBeOKResult()
  })

  it('succeeds even if owner, as long as there are others', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Owner,
      getProjectRoleCounts: async () => 2
    })

    const result = await sut({ userId: 'user-id', projectId: 'project-id' })

    expect(result).toBeOKResult()
  })

  it('fails if user not specified', async () => {
    const sut = buildSUT()

    const result = await sut({ projectId: 'project-id' })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('fails without server role', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })

    const result = await sut({ userId: 'user-id', projectId: 'project-id' })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('fails without explicit project role, even if admin', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null
    })

    const result = await sut({ userId: 'user-id', projectId: 'project-id' })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if last owner', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Owner,
      getProjectRoleCounts: async () => 1
    })

    const result = await sut({ userId: 'user-id', projectId: 'project-id' })

    expect(result).toBeAuthErrorResult({
      code: ProjectLastOwnerError.code
    })
  })

  describe('with workspace project', async () => {
    it('succeeds if project role', async () => {
      const sut = buildWorkspaceSUT()

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeOKResult()
    })

    it('succeeds even if owner, as long as there are others', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Owner,
        getProjectRoleCounts: async () => 2
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeOKResult()
    })

    it('fails without workspace role, even w/ project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Contributor,
        getWorkspaceRole: async () => null
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('fails without explicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
        getWorkspaceRole: async () => Roles.Workspace.Member
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('fails without workspace session, if needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if workspace session expired, if needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() - TIME_MS.second)
        })
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if last project owner', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Owner,
        getProjectRoleCounts: async () => 1
      })

      const result = await sut({ userId: 'user-id', projectId: 'project-id' })

      expect(result).toBeAuthErrorResult({
        code: ProjectLastOwnerError.code
      })
    })
  })
})
