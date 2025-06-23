import { describe, expect, it } from 'vitest'
import { canArchiveProjectCommentPolicy } from './canArchive.js'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import {
  getCommentFake,
  getProjectFake,
  getWorkspaceFake
} from '../../../../tests/fakes.js'
import { Roles } from '../../../../core/constants.js'
import {
  CommentNotFoundError,
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { TIME_MS } from '../../../../core/helpers/timeConstants.js'
import { ProjectVisibility } from '../../../domain/projects/types.js'

describe('canArchiveProjectCommentPolicy', () => {
  const buildSUT = (overrides?: OverridesOf<typeof canArchiveProjectCommentPolicy>) =>
    canArchiveProjectCommentPolicy({
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
        authorId: 'user-id',
        projectId: 'project-id'
      }),
      ...overrides
    })

  const buildWorkspaceSUT = (
    overrides?: OverridesOf<typeof canArchiveProjectCommentPolicy>
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

  it('can archive own comment', async () => {
    const sut = buildSUT()

    const result = await sut({
      userId: 'user-id',
      commentId: 'comment-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it("can't archive own comment w/o project roles", async () => {
    const sut = buildSUT({
      getProjectRole: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      commentId: 'comment-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it("can archive others' comments if owner", async () => {
    const sut = buildSUT({
      getComment: getCommentFake({
        id: 'comment-id',
        authorId: 'other-user-id',
        projectId: 'project-id'
      }),
      getProjectRole: async () => Roles.Stream.Owner
    })

    const result = await sut({
      userId: 'user-id',
      commentId: 'comment-id',
      projectId: 'project-id'
    })

    expect(result).toBeOKResult()
  })

  it("can't archive others' comments if not owner", async () => {
    const sut = buildSUT({
      getComment: getCommentFake({
        id: 'comment-id',
        authorId: 'other-user-id',
        projectId: 'project-id'
      }),
      getProjectRole: async () => Roles.Stream.Contributor
    })

    const result = await sut({
      userId: 'user-id',
      commentId: 'comment-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })

  it('fails if user not defined', async () => {
    const sut = buildSUT()

    const result = await sut({
      commentId: 'comment-id',
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
      commentId: 'comment-id',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('fails if comment not found', async () => {
    const sut = buildSUT({
      getComment: async () => null
    })

    const result = await sut({
      userId: 'user-id',
      commentId: 'aaaaaaaaaaaa',
      projectId: 'project-id'
    })

    expect(result).toBeAuthErrorResult({
      code: CommentNotFoundError.code
    })
  })

  describe('with workspace project', () => {
    it('can archive own comment', async () => {
      const sut = buildWorkspaceSUT()

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it("can archive others' comments if workspace admin", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Admin
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it("can archive others' comments as admin w/o sso, if not needed", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it("can arhive others' comments if explicit project owner", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getProjectRole: async () => Roles.Stream.Owner
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeOKResult()
    })

    it("can't archive others' comments if not owner", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Member
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: ProjectNotEnoughPermissionsError.code
      })
    })

    it("can't archive others' comments as owner, if no sso session", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getWorkspaceSsoSession: async () => null
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })

    it("can't archive others' comments as owner, if sso session expired", async () => {
      const sut = buildWorkspaceSUT({
        getComment: getCommentFake({
          id: 'comment-id',
          authorId: 'other-user-id',
          projectId: 'project-id'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getWorkspaceSsoSession: async () => ({
          userId: 'user-id',
          providerId: 'provider-id',
          validUntil: new Date(0)
        })
      })

      const result = await sut({
        userId: 'user-id',
        commentId: 'comment-id',
        projectId: 'project-id'
      })

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
  })
})
