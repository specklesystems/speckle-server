import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../tests/helpers/types.js'
import {
  ensureCanAccessSavedViewFragment,
  ensureCanAccessSavedViewGroupFragment
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
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError
} from '../domain/authErrors.js'
import { nanoid } from 'nanoid'

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
      ...overrides
    })

  it.each(<const>['read', 'write'])(
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
          getProjectRole: async () => null,
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

    it.each(<const>[
      { author: 'author', success: 'succeeds' },
      { author: 'not author', success: 'fails', error: SavedViewNoAccessError.code },
      {
        author: 'author but no longer contributor',
        success: 'fails',
        error: ProjectNotEnoughPermissionsError.code
      },
      {
        author: 'not author but is workspace admin',
        success: 'fails',
        error: SavedViewNoAccessError.code
      }
    ])(
      '$success if asking for write access to private (as $author)',
      async ({ author, success, error }) => {
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

    it.each(<const>['read', 'write'])(
      'fails when workspace plan is too cheap (%s)',
      async (access) => {
        const sut = buildWorkspaceSUT({
          getWorkspacePlan: getWorkspacePlanFake({
            name: 'team'
          })
        })

        const result = await sut({
          userId,
          projectId,
          savedViewId,
          access
        })
        expect(result).toBeAuthErrorResult({
          code: WorkspacePlanNoFeatureAccessError.code
        })
      }
    )

    it.each(<const>['read', 'write'])(
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
      'fails when workspace plan is too cheap (%s)',
      async (access) => {
        const sut = buildWorkspaceSUT({
          getWorkspacePlan: getWorkspacePlanFake({
            name: 'team'
          })
        })

        const result = await sut({
          userId,
          projectId,
          savedViewGroupId,
          access
        })
        expect(result).toBeAuthErrorResult({
          code: WorkspacePlanNoFeatureAccessError.code
        })
      }
    )

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
