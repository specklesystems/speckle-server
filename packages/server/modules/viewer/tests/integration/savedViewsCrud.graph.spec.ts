import {
  CreateSavedViewDocument,
  CreateSavedViewMutationVariables
} from '@/modules/core/graph/generated/graphql'
import {
  buildBasicTestModel,
  buildBasicTestProject
} from '@/modules/core/tests/helpers/creation'
import { BasicTestUser, buildBasicTestUser, createTestUser } from '@/test/authHelper'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
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
  let myProject: BasicTestStream
  let myModel1: BasicTestBranch

  const createSavedView = (input: CreateSavedViewMutationVariables) =>
    apollo.execute(CreateSavedViewDocument, input)

  before(async () => {
    me = await createTestUser(buildBasicTestUser())
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
      const resourceIdString = ViewerRoute.resourceBuilder()
        .addModel(myModel1.id)
        .toString()
      const res = await createSavedView({
        input: {
          name: 'Test Saved View',
          description: 'This is a test saved view',
          projectId: myProject.id,
          resourceIdString,
          screenshot: fakeScreenshot,
          viewerState: fakeViewerState({
            projectId: myProject.id,
            resources: {
              request: {
                resourceIdString
              }
            }
          })
        }
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.projectMutations.savedViewMutations.createView).to.be.ok
    })

    it.skip('TODO: auth policy failure')
  })

  describe('reading', () => {
    it.skip('should successfully read a saved view', () => {
      // TODO:
    })
  })
})
