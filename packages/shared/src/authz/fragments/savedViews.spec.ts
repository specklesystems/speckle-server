import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../tests/helpers/types.js'
import {
  ensureCanAccessSavedViewFragment,
  ensureCanAccessSavedViewGroupFragment,
  WriteTypes
} from './savedViews.js'
import {
  getEnvFake,
  getProjectFake,
  getSavedViewFake,
  getSavedViewGroupFake,
  getWorkspaceFake,
  getWorkspacePlanFake
} from '../../tests/fakes.js'
import { SavedViewVisibility } from '../domain/savedViews/types.js'
import { Roles } from '../../core/constants.js'
import {
  ProjectNotEnoughPermissionsError,
  SavedViewGroupNotFoundError,
  SavedViewNoAccessError,
  SavedViewNotFoundError,
  UngroupedSavedViewGroupLockError,
  WorkspaceNoAccessError
} from '../domain/authErrors.js'
import { nanoid } from 'nanoid'
import { ProjectVisibility } from '../domain/projects/types.js'

const userId = 'user-id'
const savedViewId = 'saved-view-id'
const projectId = 'project-id'
const workspaceId = 'workspace-id'
const savedViewGroupId = 'saved-view-group-id'

describe('ensureCanAccessSavedViewFragment', () => {
  const buildSUT = (overrides?: OverridesOf<typeof ensureCanAccessSavedViewFragment>) =>
    ensureCanAccessSavedViewFragment({
      getSavedView: getSavedViewFake({
        id: savedViewId,
        projectId,
        visibility: SavedViewVisibility.public
      }),
      getProject: getProjectFake({
        id: projectId,
        workspaceId: null
      }),
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: true,
        FF_SAVED_VIEWS_ENABLED: true
      }),
      getServerRole: async () => Roles.Server.User,
      getWorkspace: async () => null,
      getWorkspacePlan: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      getAdminOverrideEnabled: async () => false,
      ...overrides
    })

  it.each(<const>['read', ...Object.values(WriteTypes)])(
    'fails when not workspaced project (%s)',
    async (access) => {
      const sut = buildSUT()

      const result = await sut({
        userId,
        projectId,
        savedViewId,
        access
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    }
  )

  describe('w/ workspaced project', () => {
    const buildWorkspaceSUT = (
      overrides?: OverridesOf<typeof ensureCanAccessSavedViewFragment>
    ) =>
      buildSUT({
        getProject: getProjectFake({
          id: projectId,
          workspaceId
        }),
        getWorkspace: getWorkspaceFake({
          id: workspaceId
        }),
        getWorkspacePlan: getWorkspacePlanFake({
          name: 'pro'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null,
        ...overrides
      })

    it.each(<const>[
      { author: 'author', success: 'succeeds' },
      { author: 'not author', success: 'succeeds' },
      {
        author: 'not author and view is private',
        success: 'fails',
        error: SavedViewNoAccessError.code
      }
    ])(
      '$success if asking for read access (as $author)',
      async ({ author, success, error }) => {
        const isAuthor = author.startsWith('author')
        const isPrivate = author.includes('view is private')
        const expectSuccess = success === 'succeeds'

        const sut = buildWorkspaceSUT({
          getSavedView: getSavedViewFake({
            id: savedViewId,
            projectId,
            visibility: isPrivate
              ? SavedViewVisibility.authorOnly
              : SavedViewVisibility.public,
            authorId: isAuthor ? userId : nanoid()
          })
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access: 'read'
        })

        if (expectSuccess) {
          expect(result).toBeAuthOKResult()
        } else {
          expect(result).toBeAuthErrorResult({
            code: error
          })
        }
      }
    )

    it('succeeds if asking for read access to public projects public view, even if not a part of the project or workspace', async () => {
      const sut = buildWorkspaceSUT({
        getSavedView: getSavedViewFake({
          id: savedViewId,
          projectId,
          visibility: SavedViewVisibility.public,
          authorId: userId
        }),
        getProject: getProjectFake({
          id: projectId,
          workspaceId,
          visibility: ProjectVisibility.Public
        }),
        getProjectRole: async () => null,
        getWorkspaceRole: async () => null
      })

      const result = await sut({
        userId,
        projectId,
        savedViewId,
        access: 'read'
      })

      expect(result).toBeAuthOKResult()
    })

    it.each(<const>[
      { author: 'author', success: 'succeeds', access: WriteTypes.UpdateGeneral },
      { author: 'author', success: 'succeeds', access: WriteTypes.MoveView },
      { author: 'author', success: 'succeeds', access: WriteTypes.EditTitle },
      { author: 'author', success: 'succeeds', access: WriteTypes.EditDescription },
      {
        author: 'not author',
        success: 'fails',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.UpdateGeneral
      },
      {
        author: 'not author',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.MoveView
      },
      {
        author: 'not author',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.EditTitle
      },
      {
        author: 'not author',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.EditDescription
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code,
        access: WriteTypes.UpdateGeneral
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code,
        access: WriteTypes.MoveView
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code,
        access: WriteTypes.EditTitle
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code,
        access: WriteTypes.EditDescription
      },
      {
        author: 'not author but is workspace admin',
        success: 'fails',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.UpdateGeneral
      },
      {
        author: 'not author but is workspace admin',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.MoveView
      },
      {
        author: 'not author but is workspace admin',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.EditTitle
      },
      {
        author: 'not author but is workspace admin',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.EditDescription
      },
      // Home view:
      { author: 'author', success: 'succeeds', access: WriteTypes.SetHomeView },
      {
        author: 'not author',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.SetHomeView
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code,
        access: WriteTypes.SetHomeView
      },
      {
        author: 'not author but is workspace admin',
        success: 'succeeds',
        error: SavedViewNoAccessError.code,
        access: WriteTypes.SetHomeView
      }
    ])(
      '$success if asking for $access type write access to private (as $author)',
      async ({ author, success, error, access }) => {
        const isAuthor = author.startsWith('author')
        const isNotContributor = author.includes('no longer contributor')
        const isWorkspaceAdmin = author.includes('is workspace admin')
        const expectSuccess = success === 'succeeds'

        const sut = buildWorkspaceSUT({
          getSavedView: getSavedViewFake({
            id: savedViewId,
            projectId,
            visibility: SavedViewVisibility.public,
            authorId: isAuthor ? userId : nanoid()
          }),
          getProjectRole: async () =>
            isNotContributor ? Roles.Stream.Reviewer : Roles.Stream.Contributor,
          getWorkspaceRole: async () =>
            isWorkspaceAdmin ? Roles.Workspace.Admin : Roles.Workspace.Member
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access
        })

        if (expectSuccess) {
          expect(result).toBeAuthOKResult()
        } else {
          expect(result).toBeAuthErrorResult({
            code: error
          })
        }
      }
    )

    it.each(<const>['read', ...Object.values(WriteTypes)])(
      'succeeds to %s even on free plan',
      async (access) => {
        const sut = buildWorkspaceSUT({
          getWorkspacePlan: getWorkspacePlanFake({
            name: 'free'
          }),
          getSavedView: getSavedViewFake({
            id: savedViewId,
            projectId,
            visibility: SavedViewVisibility.public,
            authorId: userId
          })
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access
        })
        expect(result).toBeAuthOKResult()
      }
    )

    it.each(<const>['read', ...Object.values(WriteTypes)])(
      'fails if view doesnt exist (%s)',
      async (access) => {
        const sut = buildWorkspaceSUT({
          getSavedView: async () => null
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access
        })
        expect(result).toBeAuthErrorResult({
          code: SavedViewNotFoundError.code
        })
      }
    )

    it.each(<const>['read', ...Object.values(WriteTypes)])(
      `doesn't fail if view doesnt exist and allowNonExistent set (%s)`,
      async (access) => {
        const sut = buildWorkspaceSUT({
          getSavedView: async () => null
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access,
          allowNonExistent: true
        })
        expect(result).toBeAuthOKResult()
      }
    )
  })
})

describe('ensureCanAccessSavedViewGroupFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof ensureCanAccessSavedViewGroupFragment>
  ) =>
    ensureCanAccessSavedViewGroupFragment({
      getSavedViewGroup: getSavedViewGroupFake({
        projectId,
        id: savedViewGroupId
      }),
      getProject: getProjectFake({
        id: projectId,
        workspaceId: null
      }),
      getProjectRole: async () => Roles.Stream.Contributor,
      getEnv: getEnvFake({
        FF_WORKSPACES_MODULE_ENABLED: true,
        FF_SAVED_VIEWS_ENABLED: true
      }),
      getServerRole: async () => Roles.Server.User,
      getWorkspace: async () => null,
      getWorkspacePlan: async () => null,
      getWorkspaceRole: async () => null,
      getWorkspaceSsoProvider: async () => null,
      getWorkspaceSsoSession: async () => null,
      ...overrides
    })

  it.each(<const>['read', 'write'])(
    'fails when not workspaced project (%s)',
    async (access) => {
      const sut = buildSUT()

      const result = await sut({
        userId,
        projectId,
        savedViewGroupId,
        access
      })
      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    }
  )

  describe('w/ workspaced project', () => {
    const buildWorkspaceSUT = (
      overrides?: OverridesOf<typeof ensureCanAccessSavedViewGroupFragment>
    ) =>
      buildSUT({
        getProject: getProjectFake({
          id: projectId,
          workspaceId
        }),
        getWorkspace: getWorkspaceFake({
          id: workspaceId
        }),
        getWorkspacePlan: getWorkspacePlanFake({
          name: 'pro'
        }),
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoProvider: async () => null,
        getWorkspaceSsoSession: async () => null,
        ...overrides
      })

    it.each(<const>[
      { author: 'author', success: 'succeeds' },
      { author: 'not author', success: 'succeeds' }
    ])('$success if asking for read access (as $author)', async ({ author }) => {
      const isAuthor = author.startsWith('author')

      const sut = buildWorkspaceSUT({
        getProjectRole: async () => null,
        getSavedViewGroup: getSavedViewGroupFake({
          id: savedViewGroupId,
          projectId,
          authorId: isAuthor ? userId : nanoid()
        })
      })

      const result = await sut({
        userId,
        projectId,
        savedViewGroupId,
        access: 'read'
      })

      expect(result).toBeAuthOKResult()
    })

    it.each(<const>[
      { author: 'author', success: 'succeeds' },
      {
        author: 'not author',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code
      },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code
      },
      {
        author: 'not author but is workspace admin',
        success: 'succeeds'
      }
    ])(
      '$success if asking for write access to private (as $author)',
      async ({ author, success, error }) => {
        const isAuthor = author.startsWith('author')
        const isNotContributor = author.includes('no longer contributor')
        const isWorkspaceAdmin = author.includes('is workspace admin')
        const expectSuccess = success === 'succeeds'

        const sut = buildWorkspaceSUT({
          getSavedViewGroup: getSavedViewGroupFake({
            id: savedViewId,
            projectId,
            authorId: isAuthor ? userId : nanoid()
          }),
          getProjectRole: async () =>
            isNotContributor ? Roles.Stream.Reviewer : Roles.Stream.Contributor,
          getWorkspaceRole: async () =>
            isWorkspaceAdmin ? Roles.Workspace.Admin : Roles.Workspace.Member
        })

        const result = await sut({
          userId,
          projectId,
          savedViewGroupId,
          access: 'write'
        })

        if (expectSuccess) {
          expect(result).toBeAuthOKResult()
        } else {
          expect(result).toBeAuthErrorResult({
            code: error
          })
        }
      }
    )

    it('fails if writing to default group', async () => {
      const sut = buildWorkspaceSUT({
        getSavedViewGroup: getSavedViewGroupFake({
          projectId: 'project-id',
          id: 'default-XXX'
        })
      })

      const result = await sut({
        userId: 'user-id',
        projectId: 'project-id',
        savedViewGroupId: 'default-XXX',
        access: 'write'
      })

      expect(result).toBeAuthErrorResult({
        code: UngroupedSavedViewGroupLockError.code
      })
    })

    it.each(<const>['read', 'write'])(
      'fails if view doesnt exist (%s)',
      async (access) => {
        const sut = buildWorkspaceSUT({
          getSavedViewGroup: async () => null
        })

        const result = await sut({
          userId,
          projectId,
          savedViewGroupId,
          access
        })
        expect(result).toBeAuthErrorResult({
          code: SavedViewGroupNotFoundError.code
        })
      }
    )
  })
})
