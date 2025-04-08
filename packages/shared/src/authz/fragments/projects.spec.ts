import { assert, describe, expect, it } from 'vitest'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureMinimumProjectRoleFragment
} from './projects.js'
import { Roles } from '../../core/constants.js'
import { parseFeatureFlags } from '../../environment/index.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  WorkspaceNoAccessError
} from '../domain/authErrors.js'

describe('ensureMinimumProjectRoleFragment', () => {
  const buildSUT = (
    overrides?: Partial<Parameters<typeof ensureMinimumProjectRoleFragment>[0]>
  ) =>
    ensureMinimumProjectRoleFragment({
      getProject: async () => ({
        id: 'projectId',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: false
      }),
      getWorkspace: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getWorkspaceRole: async () => null,
      getServerRole: async () => Roles.Server.User,
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: async () => parseFeatureFlags({}),
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: Partial<Parameters<typeof ensureMinimumProjectRoleFragment>[0]>
  ) =>
    buildSUT({
      getProject: async () => ({
        id: 'projectId',
        workspaceId: 'workspaceId',
        isDiscoverable: false,
        isPublic: false
      }),
      getWorkspace: async () => ({
        id: 'workspaceId',
        slug: 'workspaceSlug'
      }),
      getWorkspaceSsoProvider: async () => ({
        providerId: 'ssoProviderId'
      }),
      getWorkspaceSsoSession: async () => ({
        providerId: 'ssoSessionId',
        userId: 'userId',
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24)
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

  it('fails if user does not have minimum project role', async () => {
    const result = await buildSUT({
      getProjectRole: async () => Roles.Stream.Reviewer
    })({
      userId: 'userId',
      projectId: 'projectId',
      role: Roles.Stream.Contributor
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
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
        code: ProjectNoAccessError.code
      })
    })

    it('fails if user does not have a workspace role at all', async () => {
      const result = await buildWorkspaceSUT({
        getWorkspaceRole: async () => null
      })({
        userId: 'userId',
        projectId: 'projectId',
        role: Roles.Stream.Reviewer
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })
  })
})

describe('checkIfPubliclyReadableProjectFragment', () => {
  const buildSUT = (
    overrides?: Partial<Parameters<typeof checkIfPubliclyReadableProjectFragment>[0]>
  ) =>
    checkIfPubliclyReadableProjectFragment({
      getProject: async () => ({
        id: 'projectId',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: false
      }),
      getEnv: async () => parseFeatureFlags({}),
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
      getProject: async () => ({
        id: 'projectId',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: true
      })
    })

    const result = await sut({
      projectId: 'projectId'
    })

    expect(result).toBeAuthOKResult()
    if (!result.isOk) {
      return assert.fail()
    }

    expect(result.value).toBe(true)
  })

  it('returns false if project is not public', async () => {
    const sut = buildSUT({
      getProject: async () => ({
        id: 'projectId',
        workspaceId: null,
        isDiscoverable: false,
        isPublic: false
      })
    })
    const result = await sut({
      projectId: 'projectId'
    })
    expect(result).toBeAuthOKResult()
    if (!result.isOk) {
      return assert.fail()
    }
    expect(result.value).toBe(false)
  })
})
