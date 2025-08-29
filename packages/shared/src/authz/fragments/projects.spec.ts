import { describe, expect, it } from 'vitest'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureCanUseProjectWorkspacePlanFeatureFragment,
  ensureImplicitProjectMemberWithReadAccessFragment,
  ensureImplicitProjectMemberWithWriteAccessFragment,
  ensureMinimumProjectRoleFragment,
  ensureProjectWorkspaceAccessFragment
} from './projects.js'
import { Roles } from '../../core/constants.js'
import { parseFeatureFlags } from '../../environment/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { OverridesOf } from '../../tests/helpers/types.js'
import {
  getEnvFake,
  getProjectFake,
  getWorkspaceFake,
  getWorkspacePlanFake
} from '../../tests/fakes.js'
import { TIME_MS } from '../../core/index.js'
import { ProjectVisibility } from '../domain/projects/types.js'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  WorkspacePlanFeatures
} from '../../workspaces/index.js'

describe('ensureMinimumProjectRoleFragment', () => {
  const buildSUT = (overrides?: OverridesOf<typeof ensureMinimumProjectRoleFragment>) =>
    ensureMinimumProjectRoleFragment({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      }),
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspaceRole: async () => null,
      getServerRole: async () => Roles.Server.User,
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true',
          FF_SAVED_VIEWS_ENABLED: 'true'
        }),
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof ensureMinimumProjectRoleFragment>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: 'workspaceId',
        visibility: ProjectVisibility.Workspace
      }),
      getWorkspace: getWorkspaceFake({
        id: 'workspaceId',
        slug: 'workspaceSlug'
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'ssoProviderId'
      }),
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() + TIME_MS.day)
      }),
      getWorkspaceRole: async () => Roles.Workspace.Member,
      ...overrides
    })

  it('succeeds if user has minimum project role', async () => {
    const result = await buildSUT()({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })
    expect(result).toBeAuthOKResult()
  })

  it('fails if project not found', async () => {
    const ensureMinimumProjectRoleFragment = buildSUT({
      getProject: async () => null
    })

    const result = await ensureMinimumProjectRoleFragment({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('fails if user does not have a project role', async () => {
    const result = await buildSUT({
      getProjectRole: async () => null
    })({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if user does not have minimum project role', async () => {
    const result = await buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Contributor
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  describe('with workspace project', () => {
    it('succeeds if user has minimum project role', async () => {
      const result = await buildWorkspaceSUT()({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })
      expect(result).toBeAuthOKResult()
    })

    it('succeeds if user has implicit project role', async () => {
      const result = await buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => null
      })({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('succeeds if user has implicit owner role even in private project', async () => {
      const result = await buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getProjectRole: async () => null,
        getProject: getProjectFake({
          id: 'projectId',
          workspaceId: 'workspaceId',
          visibility: ProjectVisibility.Private
        })
      })({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('fails if user doesnt have explicit project role and project is private', async () => {
      const result = await buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => null,
        getProject: getProjectFake({
          id: 'projectId',
          workspaceId: 'workspaceId',
          visibility: ProjectVisibility.Private
        })
      })({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('fails if implicit role is not enough', async () => {
      const result = await buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => null
      })({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Contributor
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })
  })
})

describe('checkIfPubliclyReadableProjectFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof checkIfPubliclyReadableProjectFragment>
  ) =>
    checkIfPubliclyReadableProjectFragment({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      }),
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true',
          FF_SAVED_VIEWS_ENABLED: 'true'
        }),
      ...overrides
    })

  it('returns result if project is found', async () => {
    const result = await buildSUT()({
      projectId: 'projectId'
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if project is not found', async () => {
    const result = await buildSUT({
      getProject: async () => null
    })({
      projectId: 'projectId'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('returns true if project is public', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null,
        visibility: ProjectVisibility.Public
      })
    })

    const result = await sut({
      projectId: 'projectId'
    })

    expect(result).toBeOKResult({ value: true })
  })

  it('returns false if project is not public', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      })
    })
    const result = await sut({
      projectId: 'projectId'
    })
    expect(result).toBeOKResult({ value: false })
  })
})

describe('ensureProjectWorkspaceAccessFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureProjectWorkspaceAccessFragment>
  ) =>
    ensureProjectWorkspaceAccessFragment({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      }),
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true',
          FF_SAVED_VIEWS_ENABLED: 'true'
        }),
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspaceRole: async () => null,
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof ensureProjectWorkspaceAccessFragment>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: 'workspaceId'
      }),
      getWorkspace: getWorkspaceFake({
        id: 'workspaceId',
        slug: 'workspaceSlug'
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'ssoProviderId'
      }),
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() + TIME_MS.day)
      }),
      getWorkspaceRole: async () => Roles.Workspace.Member,
      ...overrides
    })

  it('succeeds if project has no workspace', async () => {
    const result = await buildSUT()({
      projectId: 'projectId',
      userId: 'userId'
    })
    expect(result).toBeAuthOKResult()
  })

  it('fails if project is not found', async () => {
    const sut = buildSUT({
      getProject: async () => null
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('fails if workspace not found', async () => {
    const sut = buildWorkspaceSUT({
      getWorkspace: async () => null
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('fails if user does not have a workspace role', async () => {
    const result = await buildWorkspaceSUT({
      getWorkspaceRole: async () => null
    })({
      projectId: 'projectId',
      userId: 'userId'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('succeeds if user is guest, even w/o sso session', async () => {
    const sut = buildWorkspaceSUT({
      getWorkspaceRole: async () => Roles.Workspace.Guest,
      getWorkspaceSsoSession: async () => null
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })
    expect(result).toBeAuthOKResult()
  })

  it('succeeds if user is member, but sso not configured', async () => {
    const sut = buildWorkspaceSUT({
      getWorkspaceSsoProvider: async () => null
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })
    expect(result).toBeAuthOKResult()
  })

  it('fails if user is member, but has no sso session', async () => {
    const sut = buildWorkspaceSUT({
      getWorkspaceSsoSession: async () => null
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceSsoSessionNoAccessError.code
    })
  })

  it('fails if user is member, but sso session is expired', async () => {
    const sut = buildWorkspaceSUT({
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() - TIME_MS.day)
      })
    })

    const result = await sut({
      projectId: 'projectId',
      userId: 'userId'
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceSsoSessionNoAccessError.code
    })
  })
})

describe('ensureImplicitProjectMemberWithReadAccessFragment', async () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureImplicitProjectMemberWithReadAccessFragment>
  ) =>
    ensureImplicitProjectMemberWithReadAccessFragment({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      }),
      getAdminOverrideEnabled: async () => false,
      getServerRole: async () => Roles.Server.User,
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true',
          FF_SAVED_VIEWS_ENABLED: 'true'
        }),
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspaceRole: async () => null,
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof ensureImplicitProjectMemberWithReadAccessFragment>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: 'workspaceId',
        visibility: ProjectVisibility.Workspace
      }),
      getProjectRole: async () => null,
      getWorkspace: getWorkspaceFake({
        id: 'workspaceId',
        slug: 'workspaceSlug'
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'ssoProviderId'
      }),
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() + TIME_MS.day)
      }),
      getWorkspaceRole: async () => Roles.Workspace.Member,
      ...overrides
    })

  it('succeeds with explicit project role', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if user not specified', async () => {
    const sut = buildSUT()

    const result = await sut({
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
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
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('succeeds w/ admin override even w/o project/workspace roles and sessions', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => null,
      getAdminOverrideEnabled: async () => true
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails without project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails with a too restrictive project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Contributor
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  describe('with workspace project', () => {
    it('succeeds with implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('fails w/o explicit project role if private project', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
        getProject: getProjectFake({
          id: 'projectId',
          workspaceId: 'workspaceId',
          visibility: ProjectVisibility.Private
        })
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds w/o sso session, if workspace guest w/ explicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Guest,
        getWorkspaceSsoSession: async () => null,
        getProjectRole: async () => Roles.Stream.Contributor
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('succeeds w/o sso session, if not configured', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('fails if no sso session, but required', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if sso session expired', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          providerId: 'ssoSessionId',
          userId: 'userId',
          validUntil: new Date(Date.now() - TIME_MS.day)
        })
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})

describe('ensureImplicitProjectMemberWithWriteAccessFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureImplicitProjectMemberWithWriteAccessFragment>
  ) =>
    ensureImplicitProjectMemberWithWriteAccessFragment({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: null
      }),
      getServerRole: async () => Roles.Server.User,
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'true',
          FF_SAVED_VIEWS_ENABLED: 'true'
        }),
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspaceRole: async () => null,
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof ensureImplicitProjectMemberWithWriteAccessFragment>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'projectId',
        workspaceId: 'workspaceId',
        visibility: ProjectVisibility.Workspace
      }),
      getProjectRole: async () => null,
      getWorkspace: getWorkspaceFake({
        id: 'workspaceId',
        slug: 'workspaceSlug'
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'ssoProviderId'
      }),
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() + TIME_MS.day)
      }),
      getWorkspaceRole: async () => Roles.Workspace.Admin,
      ...overrides
    })

  it('succeeds with explicit member role', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId'
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if user not specified', async () => {
    const sut = buildSUT()

    const result = await sut({
      projectId: 'projectId'
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
      userId: 'userId',
      projectId: 'projectId'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('fails if user is guest and asking for owner', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Guest
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Owner
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('fails w/o role even if admin', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null,
      getServerRole: async () => Roles.Server.Admin
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails without project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('succeeds with reviewer role, if permitted', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Reviewer
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails with a too restrictive project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })

    const result = await sut({
      userId: 'userId',
      projectId: 'projectId'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  describe('with workspace project', () => {
    it('succeeds with implicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })

      expect(result).toBeAuthOKResult()
    })

    it('fails if workspace role not permissive enough', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it('succeeds w/ low workspace role if allowed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getProjectRole: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthOKResult()
    })

    it('succeeds w/o sso session, if workspace guest w/ explicit project role', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceRole: async () => Roles.Workspace.Guest,
        getWorkspaceSsoSession: async () => null,
        getProjectRole: async () => Roles.Stream.Contributor
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })

      expect(result).toBeAuthOKResult()
    })

    it('succeeds w/o sso session, if not configured', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })

      expect(result).toBeAuthOKResult()
    })

    it('fails if no sso session, but required', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails if sso session expired', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          providerId: 'ssoSessionId',
          userId: 'userId',
          validUntil: new Date(Date.now() - TIME_MS.day)
        })
      })

      const result = await sut({
        userId: 'userId',
        projectId: 'projectId'
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})

describe('ensureCanUseProjectWorkspacePlanFeatureFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureCanUseProjectWorkspacePlanFeatureFragment>
  ) =>
    ensureCanUseProjectWorkspacePlanFeatureFragment({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id'
      }),
      getWorkspacePlan: getWorkspacePlanFake({
        workspaceId: 'workspace-id',
        name: PaidWorkspacePlans.Pro,
        status: PaidWorkspacePlanStatuses.Valid
      }),
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: true,
        FF_SAVED_VIEWS_ENABLED: true
      }),
      ...overrides
    })

  it('succeeds if project has workspace and feature is enabled', async () => {
    const sut = buildSUT()

    const result = await sut({
      projectId: 'project-id',
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if project not found', async () => {
    const sut = buildSUT({
      getProject: async () => null
    })

    const result = await sut({
      projectId: 'project-id',
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('fails if project w/o a workspace', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      })
    })

    const result = await sut({
      projectId: 'project-id',
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })

  it('succeeds if project w/o a workspace, but allowUnworkspaced === true', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      })
    })

    const result = await sut({
      projectId: 'project-id',
      feature: WorkspacePlanFeatures.HideSpeckleBranding,
      allowUnworkspaced: true
    })

    expect(result).toBeAuthOKResult()
  })

  it('fails if projects plan does not have access to feature', async () => {
    const sut = buildSUT({
      getWorkspacePlan: getWorkspacePlanFake({
        workspaceId: 'workspace-id',
        name: PaidWorkspacePlans.Team,
        status: PaidWorkspacePlanStatuses.Valid
      })
    })

    const result = await sut({
      projectId: 'project-id',
      feature: WorkspacePlanFeatures.HideSpeckleBranding
    })

    expect(result).toBeAuthErrorResult({
      code: WorkspacePlanNoFeatureAccessError.code
    })
  })
})
