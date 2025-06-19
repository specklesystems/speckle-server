import { describe, expect, it } from 'vitest'
import { canDeleteProjectPolicy } from './canDelete.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import { Roles } from '../../../core/constants.js'
import { TIME_MS } from '../../../core/index.js'

describe('canDeleteProjectPolicy', () => {
  const buildSUT = (
    overrides?: Partial<Parameters<typeof canDeleteProjectPolicy>[0]>
  ) =>
    canDeleteProjectPolicy({
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
    overrides?: Partial<Parameters<typeof canDeleteProjectPolicy>[0]>
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
      getProjectRole: async () => null,
      getWorkspaceRole: async () => Roles.Workspace.Admin,
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

  it('works for project owner', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthOKResult()
  })

  it('it works for server admin', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    it('works for workspace admin', async () => {
      const sut = buildWorkspaceSUT()

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthOKResult()
    })

    it('it works for server admin', async () => {
      const sut = buildWorkspaceSUT({
        getServerRole: async () => Roles.Server.Admin,
        getProjectRole: async () => null,
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthOKResult()
    })
  })
})
