import {
  CreateSavedViewDocument,
  CreateSavedViewMutationVariables
} from '@/modules/core/graph/generated/graphql'
import {
  buildBasicTestModel,
  buildBasicTestProject
} from '@/modules/core/tests/helpers/creation'
import { ForbiddenError } from '@/modules/shared/errors'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import { SavedViewCreationValidationError } from '@/modules/viewer/errors/savedViews'
import { BasicTestUser, buildBasicTestUser, createTestUser } from '@/test/authHelper'
import {
  ExecuteOperationOptions,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import * as ViewerRoute from '@speckle/shared/viewer/route'
import * as ViewerState from '@speckle/shared/viewer/state'
import { expect } from 'chai'
import { merge } from 'lodash-es'
import { PartialDeep } from 'type-fest'

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
    viewerState?: ViewerState.SerializedViewerState
    overrides?: PartialDeep<CreateSavedViewMutationVariables['input']>
  }): CreateSavedViewMutationVariables => ({
    input: merge(
      {},
      {
        projectId: myProject.id,
        resourceIdString: params.resourceIdString,
        screenshot: fakeScreenshot,
        viewerState:
          params.viewerState ||
          fakeViewerState({
            projectId: myProject.id,
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
      const resourceIds = ViewerRoute.resourceBuilder().addModel(myModel1.id)
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

      const resourceIds = ViewerRoute.resourceBuilder().addModel(myModel1.id)
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
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
  })

  describe('reading', () => {
    it.skip('should successfully read a saved view', () => {
      // TODO:
    })
  })
})
