import { describe, expect, it } from 'vitest'
import { Roles } from '../../../../core/constants.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { canUpdateAutomationPolicy } from './canUpdate.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { TIME_MS } from '../../../../core/index.js'
import { ProjectVisibility } from '../../../domain/projects/types.js'
import { getWorkspaceFake } from '../../../../tests/fakes.js'

const buildCanUpdatePolicy = (
  overrides?: Partial<Parameters<typeof canUpdateAutomationPolicy>[0]>
) =>
  canUpdateAutomationPolicy({
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getProject: async () => ({
      id: 'project-id',
      workspaceId: null,
      visibility: ProjectVisibility.Private,
      allowPublicComments: false
    }),
    getProjectRole: async () => Roles.Stream.Owner,
    getServerRole: async () => Roles.Server.User,
    getWorkspace: async () => null,
    getWorkspaceRole: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    ...overrides
  })

describe('canUpdateAutomation', () => {
  it('returns error if user is not logged in', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy()

    const result = await canUpdateAutomation({
      userId: undefined,
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if user is not found', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy({
      getServerRole: async () => null
    })

    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns error project not found', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy({
      getProject: async () => null
    })

    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns error if no role at all', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy({
      getProjectRole: async () => null
    })
    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('returns error if not owner', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy({
      getProjectRole: async () => Roles.Stream.Reviewer
    })
    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('returns ok if permissible', async () => {
    const canUpdateAutomation = buildCanUpdatePolicy()
    const result = await canUpdateAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })
    expect(result).toBeAuthOKResult()
  })

  describe('with workspace project', () => {
    const overrides = {
      getProject: async () => ({
        id: 'project-id',
        workspaceId: 'workspace-id',
        visibility: ProjectVisibility.Private,
        allowPublicComments: false
      }),
      getWorkspace: getWorkspaceFake({
        id: 'workspace-id',
        slug: 'workspace-slug'
      }),
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
      }
    }

    it('returns ok if permissible', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy(overrides)
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns ok with implicit owner role', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null
      })
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no workspace role, even w/ valid project role', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceRole: async () => null,
        getProjectRole: async () => Roles.Stream.Owner
      })

      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('returns error if invalid workspace and project role', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => Roles.Stream.Contributor
      })
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('returns ok if no sso configured', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthOKResult()
    })

    it('returns error if no sso session', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceSsoSession: async () => null
      })
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('returns error if sso expired', async () => {
      const canUpdateAutomation = buildCanUpdatePolicy({
        ...overrides,
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(new Date().getTime() - TIME_MS.second)
        })
      })
      const result = await canUpdateAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
