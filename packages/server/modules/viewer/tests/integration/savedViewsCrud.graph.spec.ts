import type {
  CreateSavedViewMutationVariables,
  GetProjectSavedViewGroupsQueryVariables
} from '@/modules/core/graph/generated/graphql'
import {
  CreateSavedViewDocument,
  GetProjectSavedViewGroupsDocument
} from '@/modules/core/graph/generated/graphql'
import {
  buildBasicTestModel,
  buildBasicTestProject
} from '@/modules/core/tests/helpers/creation'
import { ForbiddenError } from '@/modules/shared/errors'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import {
  DuplicateSavedViewError,
  SavedViewCreationValidationError
} from '@/modules/viewer/errors/savedViews'
import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import type { ExecuteOperationOptions, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { addToStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import * as ViewerRoute from '@speckle/shared/viewer/route'
import * as ViewerState from '@speckle/shared/viewer/state'
import { expect } from 'chai'
import { merge, times } from 'lodash-es'
import type { PartialDeep } from 'type-fest'

const fakeScreenshot =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PiQ2YQAAAABJRU5ErkJggg=='

const fakeViewerState = (overrides?: PartialDeep<ViewerState.SerializedViewerState>) =>
  merge(
    {},
    ViewerState.formatSerializedViewerState({
      projectId: 'fake-project-id',
      resources: {
        request: {
          resourceIdString: 'a,b,c'
        }
      },
      ui: {
        camera: {
          position: [0, 0, 0],
          target: [0, 0, 0]
        }
      }
    }),
    overrides || {}
  )

describe('Saved Views GraphQL CRUD', () => {
  let apollo: TestApolloServer
  let me: BasicTestUser
  let guest: BasicTestUser
  let myProject: BasicTestStream
  let myModel1: BasicTestBranch

  const buildCreateInput = (params: {
    resourceIdString: string
    projectId?: string
    viewerState?: ViewerState.SerializedViewerState
    overrides?: PartialDeep<CreateSavedViewMutationVariables['input']>
  }): CreateSavedViewMutationVariables => ({
    input: merge(
      {},
      {
        projectId: params.projectId || myProject.id,
        resourceIdString: params.resourceIdString,
        screenshot: fakeScreenshot,
        viewerState:
          params.viewerState ||
          fakeViewerState({
            projectId: params.projectId || myProject.id,
            resources: {
              request: {
                resourceIdString: params.resourceIdString
              }
            }
          })
      },
      params.overrides || {}
    )
  })

  const createSavedView = (
    input: CreateSavedViewMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CreateSavedViewDocument, input, options)

  const model1ResourceIds = () => ViewerRoute.resourceBuilder().addModel(myModel1.id)

  before(async () => {
    me = await createTestUser(buildBasicTestUser({ name: 'me' }))
    guest = await createTestUser(buildBasicTestUser({ name: 'guest' }))
    myProject = await createTestStream(buildBasicTestProject(), me)
    myModel1 = await createTestBranch({
      branch: buildBasicTestModel(),
      stream: myProject,
      owner: me
    })

    apollo = await testApolloServer({ authUserId: me.id })
  })

  describe('creation', () => {
    it('should successfully create a saved view', async () => {
      const resourceIds = model1ResourceIds()
      const resourceIdString = resourceIds.toString()
      const viewerState = fakeViewerState({
        projectId: myProject.id,
        resources: {
          request: {
            resourceIdString
          }
        }
      })

      const res = await createSavedView(
        buildCreateInput({ resourceIdString, viewerState })
      )

      expect(res).to.not.haveGraphQLErrors()

      const view = res.data?.projectMutations.savedViewMutations.createView
      expect(view).to.be.ok
      expect(view!.id).to.be.ok
      expect(view!.name).to.contain('Scene - ') // auto-generated name
      expect(view!.description).to.be.null
      expect(view!.author?.id).to.equal(me.id)
      expect(view!.groupName).to.be.null
      expect(view!.createdAt).to.be.ok
      expect(view!.updatedAt).to.be.ok
      expect(view!.resourceIdString).to.equal(resourceIdString)
      expect(view!.resourceIds).to.deep.equal(
        resourceIds.toResources().map((r) => r.toString())
      )
      expect(view!.isHomeView).to.be.false
      expect(view!.visibility).to.equal('public') // default
      expect(view!.viewerState).to.deep.equalInAnyOrder(viewerState)
      expect(view!.screenshot).to.equal(fakeScreenshot)
      expect(view!.position).to.equal(0) // default position
    })

    it('should successfully create a saved view w/ non-default input values', async () => {
      const groupName = 'gugugaga'
      const name = 'heyooo brodie'
      const description = 'this is a description'
      const isHomeView = true
      const visibility = SavedViewVisibility.authorOnly

      const resourceIds = model1ResourceIds()
      const resourceIdString = resourceIds.toString()
      const viewerState = fakeViewerState({
        projectId: myProject.id,
        resources: {
          request: {
            resourceIdString
          }
        }
      })

      const res = await createSavedView(
        buildCreateInput({
          resourceIdString,
          viewerState,
          overrides: {
            groupName,
            name,
            description,
            isHomeView,
            visibility
          }
        })
      )

      expect(res).to.not.haveGraphQLErrors()

      const view = res.data?.projectMutations.savedViewMutations.createView
      expect(view).to.be.ok
      expect(view!.id).to.be.ok
      expect(view!.name).to.equal(name)
      expect(view!.description).to.equal(description)
      expect(view!.groupName).to.equal(groupName)
      expect(view!.isHomeView).to.equal(isHomeView)
      expect(view!.visibility).to.equal(visibility)
    })

    it('should fail if no access', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const res = await createSavedView(buildCreateInput({ resourceIdString }), {
        authUserId: guest.id
      })

      expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ invalid resourceIdString', async () => {
      const res = await createSavedView(
        buildCreateInput({
          resourceIdString: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        })
      )

      expect(res).to.haveGraphQLErrors({ code: SavedViewCreationValidationError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ invalid screenshot', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const res = await createSavedView(
        buildCreateInput({
          resourceIdString,
          overrides: { screenshot: 'invalid-screenshot' }
        }),
        {
          authUserId: me.id
        }
      )

      expect(res).to.haveGraphQLErrors({ code: SavedViewCreationValidationError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ invalid viewerState resourceIdString', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const res = await createSavedView(
        buildCreateInput({
          resourceIdString,
          overrides: {
            viewerState: fakeViewerState({
              projectId: myProject.id,
              resources: {
                request: {
                  resourceIdString: 'invalid-resource-id'
                }
              }
            })
          }
        }),
        {
          authUserId: me.id
        }
      )

      expect(res).to.haveGraphQLErrors({ code: SavedViewCreationValidationError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ invalid viewerState projectId', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const res = await createSavedView(
        buildCreateInput({
          resourceIdString,
          overrides: {
            viewerState: fakeViewerState({
              projectId: 'invalid-project-id',
              resources: {
                request: {
                  resourceIdString
                }
              }
            })
          }
        }),
        {
          authUserId: me.id
        }
      )

      expect(res).to.haveGraphQLErrors({ code: SavedViewCreationValidationError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ invalid viewerState', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const res = await createSavedView(
        buildCreateInput({
          resourceIdString,
          viewerState: { a: 1 } as unknown as ViewerState.SerializedViewerState // invalid state
        }),
        {
          authUserId: me.id
        }
      )

      expect(res).to.haveGraphQLErrors({ code: SavedViewCreationValidationError.code })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })

    it('should fail w/ duplicate name', async () => {
      const resourceIdString = model1ResourceIds().toString()
      const name = 'test1'
      const groupName = null

      await createSavedView(
        buildCreateInput({
          resourceIdString,
          overrides: {
            name,
            groupName
          }
        }),
        {
          assertNoErrors: true
        }
      )

      const res2 = await createSavedView(
        buildCreateInput({
          resourceIdString,
          overrides: {
            name,
            groupName
          }
        })
      )
      expect(res2).to.haveGraphQLErrors({ code: DuplicateSavedViewError.code })
      expect(res2.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })
  })

  describe('reading', () => {
    const NAMED_GROUP_COUNT = 15
    const GROUP_COUNT = NAMED_GROUP_COUNT + 1 // + ungrouped group
    const PAGE_COUNT = 3
    const PAGE_SIZE = Math.ceil(GROUP_COUNT / PAGE_COUNT)

    const SEARCH_STRING = 'bababooey'
    const SEARCH_STRING_ITEM_COUNT = GROUP_COUNT / 2

    const OTHER_AUTHOR_ITEM_COUNT = GROUP_COUNT / 4

    const modelIds: string[] = []
    let readTestProject: BasicTestStream
    let otherReader: BasicTestUser

    const getAllReadModelResourceIds = () =>
      ViewerRoute.resourceBuilder().addResources(
        modelIds.map((id) => new ViewerRoute.ViewerModelResource(id))
      )

    const getProjectViewGroups = (
      input: GetProjectSavedViewGroupsQueryVariables,
      options?: ExecuteOperationOptions
    ) => apollo.execute(GetProjectSavedViewGroupsDocument, input, options)

    before(async () => {
      otherReader = await createTestUser(buildBasicTestUser({ name: 'other-reader' }))
      readTestProject = await createTestStream(
        buildBasicTestProject({ name: 'read-test-project' }),
        me
      )
      await addToStream(readTestProject, otherReader, Roles.Stream.Contributor, {
        owner: me
      })

      // Create a bunch of groups (views w/ groupNames), each w/ a different model
      const createGroupView = async (groupName: string | null, idx: number) => {
        const includeSearchString = idx % 2 === 0
        const useDifferentAuthor = idx % 4 === 0

        const model = await createTestBranch({
          branch: buildBasicTestModel({
            name: `model-${groupName || 'ungrouped'}`
          }),
          stream: readTestProject,
          owner: me
        })
        modelIds.push(model.id)

        const resourceIdString = ViewerRoute.resourceBuilder()
          .addModel(model.id)
          .toString()
        const input = buildCreateInput({
          resourceIdString,
          projectId: readTestProject.id,
          overrides: {
            groupName,
            name: `View ${idx} ${includeSearchString ? SEARCH_STRING : ''}`
          }
        })
        return await createSavedView(input, {
          assertNoErrors: true,
          authUserId: useDifferentAuthor ? otherReader.id : me.id
        })
      }

      const groupNames = [...times(NAMED_GROUP_COUNT, (i) => `group-${i + 1}`), null]
      await Promise.all(
        groupNames.map((groupName, idx) => createGroupView(groupName, idx))
      )
    })

    it('should successfully read a projects view groups w/ pagination', async () => {
      let cursor: string | null = null
      let pagesLoaded = 0
      let groupsFound = 0
      const allReadModelResourceIds = getAllReadModelResourceIds()

      const loadPage = async () => {
        const res = await getProjectViewGroups({
          projectId: readTestProject.id,
          input: {
            limit: PAGE_SIZE,
            cursor,
            resourceIdString: allReadModelResourceIds.toString()
          }
        })

        expect(res).to.not.haveGraphQLErrors()

        const data = res.data?.project.savedViewGroups
        expect(data).to.be.ok
        expect(data!.totalCount).to.equal(GROUP_COUNT)

        if (data?.cursor) {
          expect(data!.items.length).to.be.lessThanOrEqual(PAGE_SIZE)
        } else {
          expect(data!.items.length).to.eq(0)
        }

        for (const group of data!.items) {
          expect(group.projectId).to.equal(readTestProject.id)
          expect(group.resourceIds).to.deep.equalInAnyOrder(
            allReadModelResourceIds.toResources().map((r) => r.toString())
          )
          groupsFound++
        }

        if (!data?.cursor) {
          expect(data?.items.length).to.be.lessThanOrEqual(PAGE_SIZE)
        }

        cursor = data?.cursor || null
        pagesLoaded++
      }

      do {
        if (pagesLoaded > PAGE_COUNT) {
          throw new Error(
            'Too many pages loaded, something is wrong with pagination logic'
          )
        }

        await loadPage()
      } while (cursor)

      expect(pagesLoaded).to.equal(PAGE_COUNT + 1) // +1 for last,empty page
      expect(groupsFound).to.equal(GROUP_COUNT)
    })

    it('should return different groups in same project, if resource string differs', async () => {
      const res = await getProjectViewGroups({
        projectId: readTestProject.id,
        input: {
          limit: GROUP_COUNT, // all in 1 page
          resourceIdString: 'ayy'
        }
      })

      expect(res).to.not.haveGraphQLErrors()
      const data = res.data?.project.savedViewGroups
      expect(data).to.be.ok
      expect(data!.totalCount).to.equal(0)
      expect(data!.items.length).to.equal(0)
      expect(data!.cursor).to.be.null
    })

    it('should respect search filter and filter out groups w/ views that dont have the search string in their name', async () => {
      const res = await getProjectViewGroups({
        projectId: readTestProject.id,
        input: {
          limit: GROUP_COUNT, // all in 1 page
          resourceIdString: getAllReadModelResourceIds().toString(),
          search: SEARCH_STRING
        }
      })

      expect(res).to.not.haveGraphQLErrors()
      const data = res.data?.project.savedViewGroups
      expect(data).to.be.ok
      expect(data!.totalCount).to.equal(SEARCH_STRING_ITEM_COUNT)
      expect(data!.items.length).to.equal(SEARCH_STRING_ITEM_COUNT)
    })

    it('should respect onlyAuthored flag', async () => {
      const res = await getProjectViewGroups({
        projectId: readTestProject.id,
        input: {
          limit: GROUP_COUNT, // all in 1 page
          resourceIdString: getAllReadModelResourceIds().toString(),
          onlyAuthored: true
        }
      })

      expect(res).to.not.haveGraphQLErrors()

      const data = res.data?.project.savedViewGroups
      expect(data).to.be.ok
      expect(data!.totalCount).to.equal(GROUP_COUNT - OTHER_AUTHOR_ITEM_COUNT)
      expect(data!.items.length).to.equal(GROUP_COUNT - OTHER_AUTHOR_ITEM_COUNT)
    })
  })
})
