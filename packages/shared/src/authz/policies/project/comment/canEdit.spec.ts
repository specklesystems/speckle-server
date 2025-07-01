import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import {
  getCommentFake,
  getProjectFake,
  getWorkspaceFake
} from '../../../../tests/fakes.js'
import { Roles } from '../../../../core/constants.js'
import {
  CommentNoAccessError,
  CommentNotFoundError,
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { canEditProjectCommentPolicy } from './canEdit.js'
import { TIME_MS } from '../../../../core/helpers/timeConstants.js'
import { ProjectVisibility } from '../../../domain/projects/types.js'

describe('canEditProjectCommentPolicy', () => {
  const buildSUT = (overrides?: OverridesOf<typeof canEditProjectCommentPolicy>) =>
    canEditProjectCommentPolicy({
      getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null
      }),
      getProjectRole: async () => Roles.Stream.Reviewer,
      getServerRole: async () => Roles.Server.User,
      getWorkspace: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getComment: getCommentFake({
        id: 'comment-id',
        projectId: 'project-id',
        authorId: 'user-id'
      }),
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof canEditProjectCommentPolicy>
  ) =>
    buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: 'workspace-id',
        allowPublicComments: false,
        visibility: ProjectVisibility.Workspace
      }),
      getProjectRole: async () => null,
      getWorkspace: getWorkspaceFake({ id: 'workspace-id', slug: 'workspace-slug' }),
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
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeOKResult()
  })

  it('succeeds w/o project role if public and public comments allowed', async () => {
    const sut = buildSUT({
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Public,
        allowPublicComments: true
      }),
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeOKResult()
  })

  it('fails if not the author, even if admin', async () => {
    const sut = buildSUT({
      getComment: getCommentFake({
        id: 'comment-id',
        projectId: 'project-id',
        authorId: 'other-user-id'
      }),
      getServerRole: async () => Roles.Server.Admin,
      getProjectRole: async () => Roles.Stream.Owner
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeAuthErrorResult({
      code: CommentNoAccessError.code
    })
  })

  it('fails if comment not found', async () => {
    const sut = buildSUT({
      getComment: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeAuthErrorResult({
      code: CommentNotFoundError.code
    })
  })

  it('fails w/o project role', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails w/o project role if public, but no public comments allowed', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null,
      getProject: getProjectFake({
        id: 'project-id',
        workspaceId: null,
        visibility: ProjectVisibility.Public,
        allowPublicComments: false
      })
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('fails if user undefined', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: undefined,
      projectId: 'project-id',
      commentId: 'comment-id'
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
      projectId: 'project-id',
      commentId: 'comment-id'
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
      projectId: 'project-id',
      commentId: 'comment-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotFoundError.code
    })
  })

  it('fails w/o project role, even if admin', async () => {
    const sut = buildSUT({
      getProjectRole: async () => null,
      getServerRole: async () => Roles.Server.Admin
    })

    const result = await sut({
      userId: 'user-id',
      projectId: 'project-id',
      commentId: 'comment-id'
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
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeOKResult()
    })

    it('succeeds w/ explicit project role, if guest', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Reviewer,
        getWorkspaceRole: async () => Roles.Workspace.Guest
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails if not the author, even if admin', async () => {
      const sut = buildSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          projectId: 'project-id',
          authorId: 'other-user-id'
        }),
        getServerRole: async () => Roles.Server.Admin,
        getProjectRole: async () => Roles.Stream.Owner,
        getWorkspaceRole: async () => Roles.Workspace.Admin
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeAuthErrorResult({
        code: CommentNoAccessError.code
      })
    })

    it('fails w/o project role, if only guest', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
        getWorkspaceRole: async () => Roles.Workspace.Guest
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })

    it('succeeds w/o session, if guest w/ explicit role', async () => {
      const sut = buildWorkspaceSUT({
        getProjectRole: async () => Roles.Stream.Reviewer,
        getWorkspaceRole: async () => Roles.Workspace.Guest,
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeOKResult()
    })

    it('succeeds w/o session, if not needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeOKResult()
    })

    it('fails w/o session, if needed', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it('fails w/ expired session', async () => {
      const sut = buildWorkspaceSUT({
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(Date.now() - TIME_MS.second)
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        commentId: 'comment-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
