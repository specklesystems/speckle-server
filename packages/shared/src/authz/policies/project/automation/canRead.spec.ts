import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { canReadAutomationPolicy } from './canRead.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { getProjectFake, getWorkspaceFake } from '../../../../tests/fakes.js'
import { Roles } from '../../../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { TIME_MS } from '../../../../core/index.js'
import { ProjectVisibility } from '../../../domain/projects/types.js'

const buildCanReadAutomationPolicy = (
  overrides?: OverridesOf<typeof canReadAutomationPolicy>
) =>
  canReadAutomationPolicy({
    getProject: getProjectFake({
      id: 'project-id',
      workspaceId: null
    }),
    getProjectRole: async () => Roles.Stream.Reviewer,
    getAdminOverrideEnabled: async () => false,
    getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
    getServerRole: async () => Roles.Server.Guest,
    getWorkspaceRole: async () => null,
    getWorkspace: async () => null,
    getWorkspaceSsoProvider: async () => null,
    getWorkspaceSsoSession: async () => null,
    ...overrides
  })

describe('canReadAutomationPolicy', () => {
  it('should allow for reviewers+', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy()

    const result = await canReadAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('should allow for admin w/ override', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy({
      getAdminOverrideEnabled: async () => true,
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null
    })

    const result = await canReadAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it('fails without user', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy()

    const result = await canReadAutomation({
      userId: undefined,
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('fails if user not found', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy({
      getServerRole: async () => null
    })

    const result = await canReadAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('fails if user has no project role', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy({
      getProjectRole: async () => null
    })

    const result = await canReadAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if project not found', async () => {
    const canReadAutomation = buildCanReadAutomationPolicy({
      getProject: async () => null
    })

    const result = await canReadAutomation({
      userId: 'user-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  describe('with workspace project', () => {
    const overrides = {
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id',
        visibility: ProjectVisibility.Workspace
      }),
      getWorkspace: getWorkspaceFake({
        id: 'workspace-id'
      }),
      getProjectRole: async () => null,
      getWorkspaceRole: async () => Roles.Workspace.Member,
      getWorkspaceSsoSession: async () => ({
        userId: 'user-id',
        providerId: 'provider-id',
        validUntil: new Date(Date.now() + TIME_MS.hour)
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'provider-id'
      })
    }

    it('succeeds w/ implicit project role', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy(overrides)

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o workspace role, even w/ project role', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy({
        ...overrides,
        getProjectRole: async () => Roles.Stream.Reviewer,
        getWorkspaceRole: async () => null
      })

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('fails w/o workspace role', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy({
        ...overrides,
        getWorkspaceRole: async () => null
      })

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds w/o sso, if not needed', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy({
        ...overrides,
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => null
      })

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o sso', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy({
        ...overrides,
        getWorkspaceSsoSession: async () => null
      })

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if sso session expired', async () => {
      const canReadAutomation = buildCanReadAutomationPolicy({
        ...overrides,
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() - TIME_MS.hour)
        })
      })

      const result = await canReadAutomation({
        userId: 'user-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
