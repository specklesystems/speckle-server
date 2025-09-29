import { db } from '@/db/knex'
import type {
  BasicSavedViewFragment,
  BasicSavedViewGroupFragment,
  CanCreateSavedViewQueryVariables,
  CanUpdateSavedViewGroupQueryVariables,
  CanUpdateSavedViewQueryVariables,
  CreateSavedViewGroupMutationVariables,
  CreateSavedViewMutationVariables,
  DeleteSavedViewGroupMutationVariables,
  DeleteSavedViewMutationVariables,
  GetModelHomeViewQueryVariables,
  GetProjectSavedViewGroupQueryVariables,
  GetProjectSavedViewGroupsQueryVariables,
  GetProjectSavedViewIfExistsQueryVariables,
  GetProjectSavedViewQueryVariables,
  GetProjectUngroupedViewGroupQueryVariables,
  UpdateSavedViewGroupMutationVariables,
  UpdateSavedViewInput,
  UpdateSavedViewMutationVariables
} from '@/modules/core/graph/generated/graphql'
import {
  CanCreateSavedViewDocument,
  CanUpdateSavedViewDocument,
  CanUpdateSavedViewGroupDocument,
  CreateSavedViewGroupDocument,
  DeleteSavedViewDocument,
  DeleteSavedViewGroupDocument,
  GetModelHomeViewDocument,
  GetProjectSavedViewDocument,
  GetProjectSavedViewGroupDocument,
  GetProjectSavedViewGroupsDocument,
  GetProjectSavedViewIfExistsDocument,
  GetProjectUngroupedViewGroupDocument,
  UpdateSavedViewDocument,
  UpdateSavedViewGroupDocument,
  ViewPositionInputType
} from '@/modules/core/graph/generated/graphql'
import {
  buildBasicTestModel,
  buildBasicTestProject
} from '@/modules/core/tests/helpers/creation'
import { BadRequestError, ForbiddenError, NotFoundError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { FactoryResultOf } from '@/modules/shared/helpers/factory'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import {
  SavedViewGroupCreationValidationError,
  SavedViewGroupNotFoundError,
  SavedViewGroupUpdateValidationError,
  SavedViewInvalidHomeViewSettingsError,
  SavedViewInvalidResourceTargetError,
  SavedViewScreenshotError,
  SavedViewUpdateValidationError
} from '@/modules/viewer/errors/savedViews'
import {
  MINIMUM_POSITION_GAP,
  updateSavedViewRecordFactory
} from '@/modules/viewer/repositories/savedViews'
import { createSavedViewFactory } from '@/modules/viewer/tests/helpers/graphql'
import {
  fakeScreenshot,
  fakeScreenshot2
} from '@/modules/viewer/tests/helpers/savedViews'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import { itEach } from '@/test/assertionHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import type { ExecuteOperationOptions, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestObject } from '@/test/speckle-helpers/commitHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { addToStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles, SeatTypes, WorkspacePlans } from '@speckle/shared'
import {
  ProjectNotEnoughPermissionsError,
  WorkspaceNoAccessError
} from '@speckle/shared/authz'
import * as ViewerRoute from '@speckle/shared/viewer/route'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import * as ViewerState from '@speckle/shared/viewer/state'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import { intersection, isUndefined, merge, times } from 'lodash-es'
import type { PartialDeep } from 'type-fest'

const { FF_WORKSPACES_MODULE_ENABLED, FF_SAVED_VIEWS_ENABLED } = getFeatureFlags()

const TOO_SMALL_OF_A_GAP = MINIMUM_POSITION_GAP / 2

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

;(FF_SAVED_VIEWS_ENABLED ? describe : describe.skip)('Saved Views GraphQL CRUD', () => {
  let apollo: TestApolloServer
  let me: BasicTestUser
  let guest: BasicTestUser
  let otherGuy: BasicTestUser
  let myProject: BasicTestStream
  let myProjectWorkspace: BasicTestWorkspace
  let myLackingProject: BasicTestStream
  let myModel1: BasicTestBranch
  let myModel2: BasicTestBranch
  let testGroup1: BasicSavedViewGroupFragment

  const buildCreateInput = (params: {
    resourceIdString: string
    projectId?: string
    viewerState?: ViewerState.SerializedViewerState
    overrides?: PartialDeep<CreateSavedViewMutationVariables['input']>
  }): CreateSavedViewMutationVariables => ({
    input: merge<
      {},
      CreateSavedViewMutationVariables['input'],
      PartialDeep<CreateSavedViewMutationVariables['input']>
    >(
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
          }),
        visibility: SavedViewVisibility.public
      },
      params.overrides || {}
    )
  })

  const createSavedView: FactoryResultOf<typeof createSavedViewFactory> = (...args) =>
    createSavedViewFactory({ apollo })(...args)

  const createSavedViewGroup = (
    input: CreateSavedViewGroupMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CreateSavedViewGroupDocument, input, options)

  const getGroup = (
    input: GetProjectSavedViewGroupQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectSavedViewGroupDocument, input, options)

  const getView = (
    input: GetProjectSavedViewQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectSavedViewDocument, input, options)

  const getViewIfExists = (
    input: GetProjectSavedViewIfExistsQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectSavedViewIfExistsDocument, input, options)

  const deleteView = (
    input: DeleteSavedViewMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(DeleteSavedViewDocument, input, options)

  const getProjectUngroupedViewGroup = (
    input: GetProjectUngroupedViewGroupQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectUngroupedViewGroupDocument, input, options)

  const canCreateSavedView = (
    input: CanCreateSavedViewQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CanCreateSavedViewDocument, input, options)

  const canUpdateSavedView = (
    input: CanUpdateSavedViewQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CanUpdateSavedViewDocument, input, options)

  const updateView = (
    input: UpdateSavedViewMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(UpdateSavedViewDocument, input, options)

  const getProjectViewGroups = (
    input: GetProjectSavedViewGroupsQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetProjectSavedViewGroupsDocument, input, options)

  const deleteSavedViewGroup = (
    input: DeleteSavedViewGroupMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(DeleteSavedViewGroupDocument, input, options)

  const canUpdateSavedViewGroup = (
    input: CanUpdateSavedViewGroupQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(CanUpdateSavedViewGroupDocument, input, options)

  const updateSavedViewGroup = (
    input: UpdateSavedViewGroupMutationVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(UpdateSavedViewGroupDocument, input, options)

  const getModelHomeView = (
    input: GetModelHomeViewQueryVariables,
    options?: ExecuteOperationOptions
  ) => apollo.execute(GetModelHomeViewDocument, input, options)

  const getDefaultGroup = async (params: {
    projectId: string
    resourceIdString: string
  }) => {
    const { projectId, resourceIdString } = params

    // Get default group id
    const groupsRes = await getProjectViewGroups(
      {
        projectId,
        input: {
          limit: 1,
          resourceIdString
        }
      },
      { assertNoErrors: true }
    )

    const defaultGroup = groupsRes.data?.project.savedViewGroups.items[0]
    expect(defaultGroup).to.be.ok
    expect(defaultGroup?.isUngroupedViewsGroup).to.be.true
    return defaultGroup!
  }

  const model1ResourceIds = () => ViewerRoute.resourceBuilder().addModel(myModel1.id)

  const model2ResourceIds = () => ViewerRoute.resourceBuilder().addModel(myModel2.id)

  before(async () => {
    const userCreate = await Promise.all([
      createTestUser(buildBasicTestUser({ name: 'me' })),
      createTestUser(buildBasicTestUser({ name: 'guest' })),
      createTestUser(buildBasicTestUser({ name: 'other-guy' }))
    ])
    me = userCreate[0]
    guest = userCreate[1]
    otherGuy = userCreate[2]

    const workspaceCreate = await Promise.all([
      createTestWorkspace(buildBasicTestWorkspace(), me, {
        addPlan: WorkspacePlans.Free
      }),
      createTestWorkspace(buildBasicTestWorkspace(), me, {
        addPlan: WorkspacePlans.Pro
      })
    ])
    myProjectWorkspace = workspaceCreate[1]

    const projectCreate = await Promise.all([
      createTestStream(
        buildBasicTestProject({
          // non-workspaced project
          workspaceId: undefined
        }),
        me
      ),
      createTestStream(
        buildBasicTestProject({
          workspaceId: myProjectWorkspace.id
        }),
        me
      )
    ])
    myLackingProject = projectCreate[0]
    myProject = projectCreate[1]

    const modelCreate = await Promise.all([
      createTestBranch({
        branch: buildBasicTestModel(),
        stream: myProject,
        owner: me
      }),
      createTestBranch({
        branch: buildBasicTestModel({ name: 'model-2' }),
        stream: myProject,
        owner: me
      })
    ])
    myModel1 = modelCreate[0]
    myModel2 = modelCreate[1]
    apollo = await testApolloServer({ authUserId: me.id })

    // We only run a small subset of tests if the module is disabled, and we dont need this stuff:
    if (FF_WORKSPACES_MODULE_ENABLED) {
      testGroup1 = (
        await createSavedViewGroup(
          {
            input: {
              projectId: myProject.id,
              resourceIdString: model1ResourceIds().toString(),
              groupName: 'Test Group 1'
            }
          },
          { assertNoErrors: true }
        )
      )?.data?.projectMutations.savedViewMutations.createGroup!
    }
  })

  if (FF_WORKSPACES_MODULE_ENABLED) {
    describe('creation', () => {
      describe('auth policy checks', () => {
        it('should fail with ForbiddenError if user is not logged in', async () => {
          const res = await createSavedView(
            buildCreateInput({ projectId: myProject.id, resourceIdString: 'abc' }),
            { authUserId: null }
          )
          expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
          expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
        })

        it('should fail with ForbiddenError if user is not a project member', async () => {
          const res = await createSavedView(
            buildCreateInput({ projectId: myProject.id, resourceIdString: 'abc' }),
            { authUserId: guest.id }
          )
          expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
          expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
        })

        it('should fail with ForbiddenError if user is a member but lacks write access', async () => {
          const newUser = await createTestUser(buildBasicTestUser({ name: 'new-user' }))
          await addToStream(myProject, newUser, Roles.Stream.Reviewer)

          const res = await createSavedView(
            buildCreateInput({ projectId: myProject.id, resourceIdString: 'abc' }),
            { authUserId: newUser.id }
          )
          expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
          expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
        })

        it('should support dedicated auth policy check', async () => {
          const res = await canCreateSavedView({
            projectId: myLackingProject.id
          })

          expect(res).to.not.haveGraphQLErrors()

          const data = res.data?.project.permissions.canCreateSavedView
          expect(data?.authorized).to.be.false
          expect(data?.code).to.equal(WorkspaceNoAccessError.code)
        })
      })

      it('should successfully create a saved view group', async () => {
        const resourceIds = model1ResourceIds()
        const resourceIdString = resourceIds.toString()

        const res = await createSavedViewGroup({
          input: {
            projectId: myProject.id,
            resourceIdString,
            groupName: 'Test Group'
          }
        })

        expect(res).to.not.haveGraphQLErrors()

        const group = res.data?.projectMutations.savedViewMutations.createGroup
        expect(group).to.be.ok
        expect(group!.id).to.be.ok
        expect(group!.projectId).to.equal(myProject.id)
        expect(group!.resourceIds).to.deep.equal(
          resourceIds.toResources().map((r) => r.toString())
        )
        expect(group!.title).to.equal('Test Group')
        expect(group!.isUngroupedViewsGroup).to.be.false
      })

      it('should successfully create a group w/o a name', async () => {
        const resourceIds = model1ResourceIds()
        const resourceIdString = resourceIds.toString()

        const res = await createSavedViewGroup({
          input: {
            projectId: myProject.id,
            resourceIdString
          }
        })

        expect(res).to.not.haveGraphQLErrors()

        const group = res.data?.projectMutations.savedViewMutations.createGroup
        expect(group).to.be.ok
        expect(group!.title.startsWith('Group -')).to.equal(true)
      })

      itEach(
        [{ val: cryptoRandomString({ length: 300 }), title: 'too long' }],
        ({ title }) => `should fail to create group w/ invalid name: ${title}`,
        async ({ val }) => {
          const resourceIds = model1ResourceIds()
          const resourceIdString = resourceIds.toString()

          const res = await createSavedViewGroup({
            input: {
              projectId: myProject.id,
              resourceIdString,
              groupName: val // invalid name
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: SavedViewGroupCreationValidationError.code
          })
          expect(res.data?.projectMutations.savedViewMutations.createGroup).to.not.be.ok
        }
      )

      it('should fail to create group w/ invalid resourceIdString', async () => {
        const res = await createSavedViewGroup({
          input: {
            projectId: myProject.id,
            resourceIdString: 'invalid',
            groupName: 'Test Group'
          }
        })

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createGroup).to.not.be.ok
      })

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
          buildCreateInput({
            resourceIdString,
            viewerState,
            overrides: {
              visibility: null // allow default
            }
          })
        )

        expect(res).to.not.haveGraphQLErrors()

        const view = res.data?.projectMutations.savedViewMutations.createView
        expect(view).to.be.ok
        expect(view!.id).to.be.ok
        expect(view!.name).to.contain('View - ') // auto-generated name
        expect(view!.description).to.be.null
        expect(view!.author?.id).to.equal(me.id)
        expect(view!.groupId).to.be.null
        expect(view!.createdAt).to.be.ok
        expect(view!.updatedAt).to.be.ok
        expect(view!.resourceIdString).to.equal(resourceIdString)
        expect(view!.resourceIds).to.deep.equal(
          resourceIds.toResources().map((r) => r.toString())
        )
        expect(view!.isHomeView).to.be.false
        expect(view!.visibility).to.equal(SavedViewVisibility.public) // default
        expect(view!.viewerState).to.deep.equalInAnyOrder(viewerState)
        expect(view!.screenshot).to.equal(fakeScreenshot)
        expect(view!.position).to.equal(1000)
      })

      it('setting a new home view unsets home view from old one', async () => {
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

        const res1 = await createSavedView(
          buildCreateInput({
            resourceIdString,
            viewerState,
            overrides: { isHomeView: true }
          }),
          { assertNoErrors: true }
        )

        const view1 = res1.data?.projectMutations.savedViewMutations.createView
        expect(view1).to.be.ok
        expect(view1!.isHomeView).to.be.true

        const res2 = await createSavedView(
          buildCreateInput({
            resourceIdString,
            viewerState,
            overrides: { isHomeView: true }
          }),
          { assertNoErrors: true }
        )

        const view2 = res2.data?.projectMutations.savedViewMutations.createView
        expect(view2).to.be.ok
        expect(view2!.isHomeView).to.be.true

        const res3 = await getView(
          {
            viewId: view1!.id,
            projectId: myProject.id
          },
          { assertNoErrors: true }
        )
        const view1Again = res3.data?.project.savedView

        expect(view1Again).to.be.ok
        expect(view1Again!.isHomeView).to.be.false
      })

      it('should successfully create a saved view w/ non-default input values', async () => {
        const groupId = testGroup1.id
        const name = 'heyooo brodie'
        const description = 'this is a description'
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
              groupId,
              name,
              description,
              isHomeView: false,
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
        expect(view!.groupId).to.equal(groupId)
        expect(view!.visibility).to.equal(visibility)
      })

      it('should fail to create view if no access', async () => {
        const resourceIdString = model1ResourceIds().toString()
        const res = await createSavedView(buildCreateInput({ resourceIdString }), {
          authUserId: guest.id
        })

        expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create view if invalid groupId', async () => {
        const resourceIdString = model1ResourceIds().toString()
        const res = await createSavedView(
          buildCreateInput({
            resourceIdString,
            overrides: { groupId: 'invalid-group-id' }
          }),
          {
            authUserId: me.id
          }
        )

        expect(res).to.haveGraphQLErrors({
          code: SavedViewGroupNotFoundError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create a private home view', async () => {
        const resourceIdString = model1ResourceIds().toString()
        const res = await createSavedView(
          buildCreateInput({
            resourceIdString,
            overrides: { isHomeView: true, visibility: SavedViewVisibility.authorOnly }
          })
        )

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create a federated home view', async () => {
        const resourceIdString = model1ResourceIds()
          .addResources(model2ResourceIds())
          .toString()
        const res = await createSavedView(
          buildCreateInput({
            resourceIdString,
            overrides: {
              isHomeView: true
            }
          })
        )

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create an object id targeting home view', async () => {
        const objectId = await createTestObject({
          projectId: myProject.id,
          object: { baba: 'booey' }
        })

        const res = await createSavedView(
          buildCreateInput({
            resourceIdString: resourceBuilder().addObject(objectId).toString(),
            overrides: {
              isHomeView: true
            }
          })
        )

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should recalculate group resourceIds on view assignment', async () => {
        const testGroup1 = (
          await createSavedViewGroup(
            {
              input: {
                projectId: myProject.id,
                resourceIdString: model1ResourceIds().toString(),
                groupName: 'Test Recalculation Group'
              }
            },
            { assertNoErrors: true }
          )
        )?.data?.projectMutations.savedViewMutations.createGroup!

        const getCurrentGroup = async () =>
          await getGroup(
            { groupId: testGroup1.id, projectId: myProject.id },
            { assertNoErrors: true }
          )

        const groupInitial = await getCurrentGroup()
        const initialResourceIds =
          groupInitial.data?.project.savedViewGroup?.resourceIds || []
        expect(initialResourceIds.find((r) => r === myModel1.id)).to.be.ok // initial empty group string only
        expect(initialResourceIds.find((r) => r === myModel2.id)).to.not.be.ok

        await createSavedView(
          buildCreateInput({
            resourceIdString: model2ResourceIds().toString(),
            overrides: { groupId: testGroup1.id }
          }),
          { assertNoErrors: true }
        )

        const groupAfter = await getCurrentGroup()
        const updatedResourceIds =
          groupAfter.data?.project.savedViewGroup?.resourceIds || []

        expect(updatedResourceIds.find((r) => r === myModel1.id)).to.not.be.ok // gone, no such views in there
        expect(updatedResourceIds.find((r) => r === myModel2.id)).to.be.ok // this is now added
      })

      it('should fail to create view w/ invalid resourceIdString', async () => {
        const res = await createSavedView(
          buildCreateInput({
            resourceIdString:
              'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
          })
        )

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create view w/ invalid screenshot', async () => {
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

        expect(res).to.haveGraphQLErrors({
          code: SavedViewScreenshotError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create view w/ invalid viewerState resourceIdString', async () => {
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

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create view w/ invalid viewerState projectId', async () => {
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

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should fail to create view w/ invalid viewerState', async () => {
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

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
      })

      it('should not fail to create view w/ duplicate name', async () => {
        const resourceIdString = model1ResourceIds().toString()
        const name = 'test1'

        await createSavedView(
          buildCreateInput({
            resourceIdString,
            overrides: {
              name,
              groupId: null
            }
          }),
          {
            assertNoErrors: true
          }
        )

        await createSavedView(
          buildCreateInput({
            resourceIdString,
            overrides: {
              name,
              groupId: null
            }
          }),
          { assertNoErrors: true }
        )
      })

      itEach(
        [
          { grouping: 'ungrouped', expectedPosition: 'before' },
          { grouping: 'grouped', expectedPosition: 'before' },
          { grouping: 'ungrouped', expectedPosition: 'after' },
          { grouping: 'grouped', expectedPosition: 'after' }
        ],
        ({ grouping, expectedPosition }) =>
          `should add new view ${expectedPosition} the other view in the ${grouping} group`,
        async ({ grouping, expectedPosition }) => {
          const addBefore = expectedPosition === 'before'
          const resourceIdString = model1ResourceIds().toString()
          const res1 = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const firstView = res1.data?.projectMutations.savedViewMutations.createView!

          const res2 = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null,
                ...(expectedPosition
                  ? {
                      position: {
                        type: ViewPositionInputType.Between,
                        beforeViewId: !addBefore ? firstView.id : null,
                        afterViewId: addBefore ? firstView.id : null
                      }
                    }
                  : {})
              }
            }),
            {
              assertNoErrors: true
            }
          )

          const finalView = res2.data?.projectMutations.savedViewMutations.createView
          if (addBefore) {
            expect(finalView!.position).to.be.lessThan(firstView!.position)
          } else {
            expect(finalView!.position).to.be.greaterThan(firstView!.position)
          }
        }
      )

      itEach(
        [
          { grouping: 'ungrouped', specificLastPosition: true },
          { grouping: 'grouped', specificLastPosition: true },
          { grouping: 'ungrouped', specificLastPosition: false },
          { grouping: 'grouped', specificLastPosition: false }
        ],
        ({ grouping, specificLastPosition }) =>
          `should add new views after the${
            specificLastPosition ? ' specifically specified' : ''
          } last position in the ${grouping} group`,
        async ({ grouping, specificLastPosition }) => {
          const resourceIdString = model1ResourceIds().toString()
          const res1 = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null
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
                groupId: grouping === 'grouped' ? testGroup1.id : null,
                ...(specificLastPosition
                  ? {
                      position: {
                        type: ViewPositionInputType.Between,
                        beforeViewId:
                          res1.data?.projectMutations.savedViewMutations.createView!.id,
                        afterViewId: null
                      }
                    }
                  : {})
              }
            }),
            {
              assertNoErrors: true
            }
          )

          const firstView = res1.data?.projectMutations.savedViewMutations.createView
          const finalView = res2.data?.projectMutations.savedViewMutations.createView
          expect(finalView!.position).to.equal(firstView!.position + 1000)
        }
      )

      itEach(
        ['ungrouped', 'grouped'],
        (grouping) =>
          `should allow positioning between 2 other views and rebalance ${grouping} group when positions get too close`,
        async (grouping) => {
          const resourceIdString = model1ResourceIds().toString()
          const beforeViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const beforeView =
            beforeViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(beforeView.position).to.be.ok

          const afterViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const afterView =
            afterViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(afterView.position).to.be.ok

          // API doesnt allow direct control over position, so
          // we need to do this directly in DB
          const updateView = updateSavedViewRecordFactory({ db })
          const newFixablePos = beforeView.position! + TOO_SMALL_OF_A_GAP
          await updateView({
            id: afterView.id,
            projectId: afterView.projectId,
            update: {
              position: newFixablePos
            }
          })

          // Now lets insert new view in the middle, and recalculation should happen
          const middleViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              overrides: {
                groupId: grouping === 'grouped' ? testGroup1.id : null,
                position: {
                  type: ViewPositionInputType.Between,
                  beforeViewId: beforeView.id,
                  afterViewId: afterView.id
                }
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const middleView =
            middleViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(middleView.position).to.be.ok

          // Now list that "group" again, check that all 3 views are there
          // and have fixed positions
          const groupWithViews =
            grouping === 'grouped'
              ? await getGroup(
                  {
                    groupId: testGroup1.id,
                    projectId: myProject.id
                  },
                  { assertNoErrors: true }
                ).then((r) => r.data?.project.savedViewGroup)
              : await getProjectUngroupedViewGroup(
                  {
                    projectId: myProject.id,
                    input: { resourceIdString }
                  },
                  { assertNoErrors: true }
                ).then((r) => r.data?.project.ungroupedViewGroup)

          expect(groupWithViews).to.be.ok
          expect(
            groupWithViews?.views.items.filter((v) =>
              [beforeView.id, afterView.id, middleView.id].includes(v.id)
            ).length
          ).to.be.eq(3)

          let prevPosition: number | undefined = undefined
          for (const view of groupWithViews?.views.items || []) {
            if (!isUndefined(prevPosition)) {
              expect(view.position).to.be.eq(prevPosition - 1000)
            }

            prevPosition = view.position
          }
        }
      )
    })

    describe('updates', () => {
      let updatablesProject: BasicTestStream
      let models: BasicTestBranch[]
      let modelWithoutViews: BasicTestBranch
      let testView: BasicSavedViewFragment
      let testView2: BasicSavedViewFragment
      let optionalGroup: BasicSavedViewGroupFragment
      let notAuthorButContributor: BasicTestUser

      before(async () => {
        notAuthorButContributor = await createTestUser({
          name: 'not author but contributor'
        })
        await assignToWorkspace(
          myProjectWorkspace,
          notAuthorButContributor,
          Roles.Workspace.Member,
          SeatTypes.Editor
        )

        updatablesProject = await createTestStream(
          buildBasicTestProject({
            name: 'updatables-project',
            workspaceId: myProjectWorkspace.id
          }),
          me
        )

        await Promise.all([
          addToStream(updatablesProject, otherGuy, Roles.Stream.Reviewer),
          addToStream(
            updatablesProject,
            notAuthorButContributor,
            Roles.Stream.Contributor
          )
        ])

        models = await Promise.all(
          times(3, async (i) => {
            return await createTestBranch({
              branch: buildBasicTestModel({
                name: `Model #${i}`
              }),
              stream: updatablesProject,
              owner: me
            })
          })
        )
        modelWithoutViews = await createTestBranch({
          branch: buildBasicTestModel({
            name: `Model w/o views`
          }),
          stream: updatablesProject,
          owner: me
        })

        optionalGroup = (
          await createSavedViewGroup(
            {
              input: {
                projectId: updatablesProject.id,
                resourceIdString: models[0].id,
                groupName: 'Test Recalculation Group'
              }
            },
            { assertNoErrors: true }
          )
        )?.data?.projectMutations.savedViewMutations.createGroup!
      })

      beforeEach(async () => {
        await Promise.all([
          createSavedView(
            buildCreateInput({
              projectId: updatablesProject.id,
              resourceIdString: models[0].id,
              overrides: { name: 'View to update' }
            }),
            { assertNoErrors: true }
          ).then((createRes1) => {
            testView = createRes1.data?.projectMutations.savedViewMutations.createView!
            expect(testView).to.be.ok
          }),
          createSavedView(
            buildCreateInput({
              projectId: updatablesProject.id,
              resourceIdString: models[0].id,
              overrides: { name: 'View to update 2' }
            }),
            { assertNoErrors: true }
          ).then((createRes2) => {
            testView2 = createRes2.data?.projectMutations.savedViewMutations.createView!
            expect(testView2).to.be.ok
          })
        ])
      })

      afterEach(async () => {
        await Promise.all([
          deleteView(
            {
              input: {
                id: testView.id,
                projectId: updatablesProject.id
              }
            },
            { assertNoErrors: true }
          ),
          deleteView(
            {
              input: {
                id: testView2.id,
                projectId: updatablesProject.id
              }
            },
            { assertNoErrors: true }
          )
        ])
      })

      const buildResourcesUpdate = (resourceIdString = 'invalid-resource-id') => ({
        resourceIdString,
        screenshot: fakeScreenshot,
        viewerState: fakeViewerState({
          projectId: updatablesProject.id,
          resources: {
            request: {
              resourceIdString
            }
          }
        })
      })

      it('successfully updates a saved view (name)', async () => {
        const newName = 'Updated View Name'

        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            name: newName
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        const updatedView = res.data?.projectMutations.savedViewMutations.updateView
        expect(updatedView).to.be.ok
        expect(updatedView!.id).to.equal(testView.id)
        expect(updatedView!.name).to.equal(newName)

        const initUpdatedAt = dayjs(testView.updatedAt)
        const newUpdatedAt = dayjs(updatedView!.updatedAt)
        expect(newUpdatedAt.isSame(initUpdatedAt)).to.be.true // shouldnt update date
      })

      const noDateUpdateKeys: (keyof Omit<
        UpdateSavedViewInput,
        | 'id'
        | 'projectId'
        | 'resourceIdString'
        | 'viewerState'
        | 'screenshot'
        | 'groupId'
      >)[] = ['name', 'description', 'isHomeView', 'visibility']

      itEach(
        noDateUpdateKeys,
        (updateKey) => `just updating ${updateKey} does not update updatedAt`,
        async (updateKey) => {
          const input: UpdateSavedViewInput = {
            id: testView.id,
            projectId: updatablesProject.id,
            ...(updateKey === 'visibility'
              ? { visibility: SavedViewVisibility.authorOnly }
              : {}),
            ...(updateKey === 'isHomeView' ? { isHomeView: !testView.isHomeView } : {}),
            ...(updateKey === 'name' ? { name: 'Updated View Nameeeeee' } : {}),
            ...(updateKey === 'description'
              ? { description: 'Updated description :)' }
              : {})
          }

          const res = await updateView({ input })

          expect(res).to.not.haveGraphQLErrors()
          const updatedView = res.data?.projectMutations.savedViewMutations.updateView
          expect(updatedView).to.be.ok
          expect(updatedView!.id).to.equal(testView.id)

          expect(updatedView![updateKey]).to.equal(input[updateKey])

          const initUpdatedAt = dayjs(testView.updatedAt)
          const newUpdatedAt = dayjs(updatedView!.updatedAt)
          expect(newUpdatedAt.isSame(initUpdatedAt)).to.be.true // should not be updated
        }
      )

      itEach(
        ['replace', 'move'],
        (action) => `invoking a ${action} updates updatedAt`,
        async (action) => {
          const input: UpdateSavedViewInput = {
            id: testView.id,
            projectId: updatablesProject.id,
            ...(action === 'replace' ? buildResourcesUpdate(models.at(-1)!.id) : {}),
            ...(action === 'move' ? { groupId: optionalGroup.id } : {})
          }

          const res = await updateView({ input })

          expect(res).to.not.haveGraphQLErrors()
          const updatedView = res.data?.projectMutations.savedViewMutations.updateView
          expect(updatedView).to.be.ok
          expect(updatedView!.id).to.equal(testView.id)

          const initUpdatedAt = dayjs(testView.updatedAt)
          const newUpdatedAt = dayjs(updatedView!.updatedAt)
          expect(newUpdatedAt.isAfter(initUpdatedAt)).to.be.true // date should be updated
        }
      )

      itEach(
        ['ungrouped', 'grouped'],
        (grouping) =>
          `should update view to have the last position in the ${grouping} group w/ an empty position input`,
        async (grouping) => {
          const resourceIdString = models[0].id
          const res1 = await createSavedView(
            buildCreateInput({
              resourceIdString,
              projectId: updatablesProject.id,
              overrides: {
                groupId: grouping === 'grouped' ? optionalGroup.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )

          const res2 = await createSavedView(
            buildCreateInput({
              resourceIdString,
              projectId: updatablesProject.id,
              overrides: {
                groupId: grouping === 'grouped' ? optionalGroup.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )

          const firstView = res1.data?.projectMutations.savedViewMutations.createView
          const secondView = res2.data?.projectMutations.savedViewMutations.createView
          expect(secondView!.position).to.equal(firstView!.position! + 1000)

          const rest3 = await updateView(
            {
              input: {
                id: firstView!.id,
                projectId: updatablesProject.id,
                position: {
                  // empty input means "move to end"
                  type: ViewPositionInputType.Between
                }
              }
            },
            { assertNoErrors: true }
          )
          const firstViewAgain =
            rest3.data?.projectMutations.savedViewMutations.updateView!
          expect(firstViewAgain.position).to.equal(secondView!.position! + 1000)
        }
      )

      itEach(
        ['ungrouped', 'grouped'],
        (grouping) =>
          `should allow updating position between 2 other views and rebalance ${grouping} group when positions get too close`,
        async (grouping) => {
          const resourceIdString = models[0].id
          const projectId = updatablesProject.id
          const firstViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              projectId,
              overrides: {
                groupId: grouping === 'grouped' ? optionalGroup.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const firstView =
            firstViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(firstView.position).to.be.ok

          const secondViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              projectId,
              overrides: {
                groupId: grouping === 'grouped' ? optionalGroup.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const secondView =
            secondViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(secondView.position).to.be.eq(firstView.position! + 1000)

          const thirdViewRes = await createSavedView(
            buildCreateInput({
              resourceIdString,
              projectId,
              overrides: {
                groupId: grouping === 'grouped' ? optionalGroup.id : null
              }
            }),
            {
              assertNoErrors: true
            }
          )
          const thirdView =
            thirdViewRes.data?.projectMutations.savedViewMutations.createView!
          expect(thirdView.position).to.be.eq(secondView.position! + 1000)

          // API doesnt allow direct control over position, so
          // we need to do this directly in DB
          const updateViewDb = updateSavedViewRecordFactory({ db })
          const newFixablePos = firstView.position! + TOO_SMALL_OF_A_GAP
          await updateViewDb({
            id: secondView.id,
            projectId: secondView.projectId,
            update: {
              position: newFixablePos
            }
          })

          // Now lets update the third view to be in the middle, and recalculation should happen
          const thirdViewAgainRes = await updateView(
            {
              input: {
                id: thirdView.id,
                projectId: updatablesProject.id,
                position: {
                  type: ViewPositionInputType.Between,
                  beforeViewId: firstView.id,
                  afterViewId: secondView.id
                }
              }
            },
            {
              assertNoErrors: true
            }
          )
          const middleView =
            thirdViewAgainRes.data?.projectMutations.savedViewMutations.updateView!
          expect(middleView.position).to.be.ok

          // Now list that "group" again, check that all 3 views are there
          // and have fixed positions
          const groupWithViews =
            grouping === 'grouped'
              ? await getGroup(
                  {
                    groupId: optionalGroup.id,
                    projectId: updatablesProject.id
                  },
                  { assertNoErrors: true }
                ).then((r) => r.data?.project.savedViewGroup)
              : await getProjectUngroupedViewGroup(
                  {
                    projectId: updatablesProject.id,
                    input: { resourceIdString }
                  },
                  { assertNoErrors: true }
                ).then((r) => r.data?.project.ungroupedViewGroup)

          expect(groupWithViews).to.be.ok
          expect(
            groupWithViews?.views.items.filter((v) =>
              [firstView.id, secondView.id, middleView.id].includes(v.id)
            ).length
          ).to.be.eq(3)

          let prevPosition: number | undefined = undefined
          for (const view of groupWithViews?.views.items || []) {
            if (!isUndefined(prevPosition)) {
              expect(view.position).to.be.eq(prevPosition - 1000)
            }

            prevPosition = view.position
          }
        }
      )

      it('successfully updated everyting in a saved view', async () => {
        const input: UpdateSavedViewInput = {
          id: testView.id,
          projectId: updatablesProject.id,
          // NEW UPDATES
          resourceIdString: models.at(-1)!.id,
          groupId: optionalGroup.id,
          name: 'Updated View Name',
          description: 'Updated description :)',
          viewerState: fakeViewerState({
            projectId: updatablesProject.id,
            resources: {
              request: {
                resourceIdString: models.at(-1)!.id
              }
            }
          }),
          screenshot: fakeScreenshot2,
          isHomeView: false,
          visibility: SavedViewVisibility.authorOnly
        }
        const res = await updateView({
          input
        })

        expect(res).to.not.haveGraphQLErrors()

        const updatedView = res.data?.projectMutations.savedViewMutations.updateView
        expect(updatedView).to.be.ok
        expect(updatedView!.id).to.equal(testView.id)
        expect(updatedView!.name).to.equal(input.name)
        expect(updatedView!.description).to.equal(input.description)
        expect(updatedView!.groupId).to.equal(input.groupId)
        expect(updatedView!.resourceIdString).to.equal(input.resourceIdString)
        expect(updatedView!.viewerState).to.deep.equalInAnyOrder(input.viewerState)
        expect(updatedView!.screenshot).to.equal(input.screenshot)
        expect(updatedView!.isHomeView).to.equal(input.isHomeView)
        expect(updatedView!.visibility).to.equal(input.visibility)

        const initUpdatedAt = dayjs(testView.updatedAt)
        const newUpdatedAt = dayjs(updatedView!.updatedAt)
        expect(newUpdatedAt.isAfter(initUpdatedAt)).to.be.true // date should be updated cause of full replace
      })

      it('successfully sets and unsets a group', async () => {
        const newGroupId = optionalGroup.id

        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            groupId: newGroupId
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        const updatedView = res.data?.projectMutations.savedViewMutations.updateView
        expect(updatedView).to.be.ok
        expect(updatedView!.id).to.equal(testView.id)
        expect(updatedView!.groupId).to.equal(newGroupId)

        // Unset group
        const res2 = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            groupId: null
          }
        })

        expect(res2).to.not.haveGraphQLErrors()
        const updatedView2 = res2.data?.projectMutations.savedViewMutations.updateView
        expect(updatedView2).to.be.ok
        expect(updatedView2!.id).to.equal(testView.id)
        expect(updatedView2!.groupId).to.be.null
      })

      it('allow setting default group as group, which actually sets it to null', async () => {
        const defaultGroup = await getDefaultGroup({
          projectId: updatablesProject.id,
          resourceIdString: models[0].id
        })
        const update = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              groupId: defaultGroup!.id
            }
          },
          { assertNoErrors: true }
        )

        const updatedView = update.data?.projectMutations.savedViewMutations.updateView
        expect(updatedView?.id).to.be.ok
        expect(updatedView?.groupId).to.be.null
        expect(updatedView?.group.id).to.equal(defaultGroup!.id)
      })

      it('empty string name update gets ignored', async () => {
        const updatedname = ''

        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            name: updatedname
          }
        })

        // should show empty changes update as we have nothing else to update
        expect(res).to.haveGraphQLErrors({
          code: SavedViewUpdateValidationError.code,
          message: 'No changes submitted with the input'
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView.id).to.not.be.ok
      })

      it('setting a new home view unsets home view from old one', async () => {
        const res1 = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              isHomeView: true
            }
          },
          { assertNoErrors: true }
        )

        const view1 = res1.data?.projectMutations.savedViewMutations.updateView
        expect(view1).to.be.ok
        expect(view1!.isHomeView).to.be.true

        const res2 = await updateView(
          {
            input: {
              id: testView2.id,
              projectId: updatablesProject.id,
              isHomeView: true
            }
          },
          { assertNoErrors: true }
        )

        const view2 = res2.data?.projectMutations.savedViewMutations.updateView
        expect(view2).to.be.ok
        expect(view2!.isHomeView).to.be.true

        const res3 = await getView(
          {
            viewId: testView.id,
            projectId: updatablesProject.id
          },
          { assertNoErrors: true }
        )
        const view1Again = res3.data?.project.savedView

        expect(view1Again).to.be.ok
        expect(view1Again!.isHomeView).to.be.false
      })

      it('models w/ and w/o saved views resolve resourceIdString correctly', async () => {
        await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              isHomeView: true
            }
          },
          { assertNoErrors: true }
        )

        const testViewModelId = models[0].id
        const resWithHomeView = await getModelHomeView(
          {
            projectId: updatablesProject.id,
            modelId: testViewModelId
          },
          { assertNoErrors: true }
        )
        expect(resWithHomeView.data?.project.model.resourceIdString).to.eq(
          testViewModelId
        )

        const resWithoutHomeView = await getModelHomeView(
          {
            projectId: updatablesProject.id,
            modelId: modelWithoutViews.id
          },
          { assertNoErrors: true }
        )
        expect(resWithoutHomeView.data?.project.model.resourceIdString).to.eq(
          modelWithoutViews.id
        )
      })

      it('fails if updating view to be private home view', async () => {
        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            isHomeView: true,
            visibility: SavedViewVisibility.authorOnly
          }
        })

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if updating already home view to be private view', async () => {
        await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              isHomeView: true
            }
          },
          { assertNoErrors: true }
        )

        const res2 = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            visibility: SavedViewVisibility.authorOnly
          }
        })

        expect(res2).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res2.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if updating view to be a federated home view', async () => {
        const resourceIdString = resourceBuilder()
          .addModel(models.at(-1)!.id)
          .addModel(models.at(-2)!.id)
          .toString()

        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            isHomeView: true,
            resourceIdString,
            viewerState: fakeViewerState({
              projectId: updatablesProject.id,
              resources: {
                request: {
                  resourceIdString
                }
              }
            }),
            screenshot: fakeScreenshot2
          }
        })

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if updating view to be an object targetting home view', async () => {
        const objectId = await createTestObject({
          projectId: updatablesProject.id,
          object: { aa: 'bb' }
        })

        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            isHomeView: true,
            resourceIdString: objectId,
            viewerState: fakeViewerState({
              projectId: updatablesProject.id,
              resources: {
                request: {
                  resourceIdString: objectId
                }
              }
            }),
            screenshot: fakeScreenshot2
          }
        })

        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidHomeViewSettingsError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('succeeds if non author contributor is renaming the view', async () => {
        const newName = 'Updated View Name'

        const res = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              name: newName
            }
          },
          { authUserId: notAuthorButContributor.id }
        )

        expect(res).to.not.haveGraphQLErrors({ code: ForbiddenError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.be.ok

        const update = res.data?.projectMutations.savedViewMutations.updateView
        expect(update?.name).to.equal(newName)
      })

      it('succeeds if non author contributor is updating the description of the view', async () => {
        const newDescription = 'Updated View Description'

        const res = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              description: newDescription
            }
          },
          { authUserId: notAuthorButContributor.id }
        )

        expect(res).to.not.haveGraphQLErrors({ code: ForbiddenError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.be.ok

        const update = res.data?.projectMutations.savedViewMutations.updateView
        expect(update?.description).to.equal(newDescription)
      })

      it('succeeds if non author contributor is just moving the view', async () => {
        const res = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              groupId: optionalGroup.id,
              position: {
                type: ViewPositionInputType.Between
              }
            }
          },
          { authUserId: notAuthorButContributor.id }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.be.ok

        const update = res.data?.projectMutations.savedViewMutations.updateView
        expect(update?.groupId).to.equal(optionalGroup.id)
      })

      it('fails if non author contributor is updating the visibility of the view', async () => {
        const newVisibility = SavedViewVisibility.authorOnly

        const res = await updateView(
          {
            input: {
              id: testView.id,
              projectId: updatablesProject.id,
              visibility: newVisibility
            }
          },
          { authUserId: notAuthorButContributor.id }
        )

        expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if view does not exist', async () => {
        const res = await updateView({
          input: { id: 'non-existent-id', projectId: updatablesProject.id, name: 'x' }
        })
        expect(res).to.haveGraphQLErrors({ code: NotFoundError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if no changes submitted', async () => {
        const res = await updateView({
          input: { id: testView.id, projectId: updatablesProject.id }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewUpdateValidationError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if updating resourceIdString/viewerState/screenshot with missing required fields', async () => {
        // Only resourceIdString
        let res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            resourceIdString: models[0].id
          }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewUpdateValidationError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok

        // Only viewerState
        res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            viewerState: { a: 1 }
          }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewUpdateValidationError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok

        // Only screenshot
        res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            screenshot: fakeScreenshot2
          }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewUpdateValidationError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if groupId does not exist', async () => {
        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            groupId: 'non-existent-group-id',
            name: 'x'
          }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewGroupNotFoundError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if screenshot is invalid', async () => {
        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            screenshot: 'not-base64',
            name: 'x'
          }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewScreenshotError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails if name is too long', async () => {
        const longName = 'x'.repeat(256)
        const res = await updateView({
          input: { id: testView.id, projectId: updatablesProject.id, name: longName }
        })
        expect(res).to.haveGraphQLErrors({ code: SavedViewUpdateValidationError.code })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails updating resourceIdString, if its invalid', async () => {
        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            ...buildResourcesUpdate(),
            resourceIdString: 'invalid-resource-id'
          }
        })
        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      it('fails updating viewerState, if its invalid', async () => {
        const res = await updateView({
          input: {
            id: testView.id,
            projectId: updatablesProject.id,
            ...buildResourcesUpdate(),
            viewerState: { a: 1 } as unknown as ViewerState.SerializedViewerState // invalid state
          }
        })
        expect(res).to.haveGraphQLErrors({
          code: SavedViewInvalidResourceTargetError.code
        })
        expect(res.data?.projectMutations.savedViewMutations.updateView).to.not.be.ok
      })

      describe('to groups', () => {
        let updatableGroup: BasicSavedViewGroupFragment

        beforeEach(async () => {
          const createRes = await createSavedViewGroup(
            {
              input: {
                projectId: updatablesProject.id,
                resourceIdString: models[0].id,
                groupName: 'Group to update'
              }
            },
            { assertNoErrors: true }
          )
          const group = createRes.data?.projectMutations.savedViewMutations.createGroup!
          expect(group).to.be.ok
          updatableGroup = group
        })

        afterEach(async () => {
          await deleteSavedViewGroup({
            input: {
              groupId: updatableGroup.id,
              projectId: updatablesProject.id
            }
          })
        })

        it('successfully update the name', async () => {
          const updatedname = 'babababababababa123'

          const res = await updateSavedViewGroup({
            input: {
              groupId: updatableGroup.id,
              projectId: updatableGroup.projectId,
              name: updatedname
            }
          })

          expect(res).to.not.haveGraphQLErrors()

          const group = res.data?.projectMutations.savedViewMutations.updateGroup
          expect(group?.id).to.be.ok
          expect(group?.title).to.equal(updatedname)
        })

        it('fail invalid name length', async () => {
          const updatedname = 'a'.repeat(300)

          const res = await updateSavedViewGroup({
            input: {
              groupId: updatableGroup.id,
              projectId: updatableGroup.projectId,
              name: updatedname
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: SavedViewGroupUpdateValidationError.code
          })
          expect(res.data?.projectMutations.savedViewMutations.updateGroup.id).to.not.be
            .ok
        })

        it('empty string name update gets ignored', async () => {
          const updatedname = ''

          const res = await updateSavedViewGroup({
            input: {
              groupId: updatableGroup.id,
              projectId: updatableGroup.projectId,
              name: updatedname
            }
          })

          // should show empty changes update as we have nothing else to update
          expect(res).to.haveGraphQLErrors({
            code: SavedViewGroupUpdateValidationError.code,
            message: 'No changes submitted with the input'
          })
          expect(res.data?.projectMutations.savedViewMutations.updateGroup.id).to.not.be
            .ok
        })

        it('prevent updates to default/ungrouped groups', async () => {
          const defaultGroup = await getDefaultGroup({
            projectId: updatableGroup.projectId,
            resourceIdString: models[0].id
          })

          const res = await updateSavedViewGroup({
            input: {
              groupId: defaultGroup.id,
              projectId: defaultGroup.projectId,
              name: 'New Group Name'
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: BadRequestError.code,
            message: 'ungrouped group cannot be modified'
          })
          expect(res.data?.projectMutations.savedViewMutations.updateGroup.id).to.not.be
            .ok
        })

        it('prevent updates to nonexistant groups', async () => {
          const res = await updateSavedViewGroup({
            input: {
              groupId: 'nonexistent-group-id',
              projectId: updatableGroup.projectId,
              name: 'New Group Name'
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: NotFoundError.code
          })
          expect(res.data?.projectMutations.savedViewMutations.updateGroup.id).to.not.be
            .ok
        })

        it('disallow empty changes being submitted', async () => {
          const res = await updateSavedViewGroup({
            input: {
              groupId: updatableGroup.id,
              projectId: updatableGroup.projectId
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: SavedViewGroupUpdateValidationError.code
          })
          expect(res.data?.projectMutations.savedViewMutations.updateGroup.id).to.not.be
            .ok
        })
      })
    })

    describe('deletions', () => {
      let deletablesProject: BasicTestStream
      let models: BasicTestBranch[]
      let deletableView: BasicSavedViewFragment
      let deletableGroup: BasicSavedViewGroupFragment

      before(async () => {
        deletablesProject = await createTestStream(
          buildBasicTestProject({
            name: 'deletables-project',
            workspaceId: myProjectWorkspace.id
          }),
          me
        )

        models = await Promise.all(
          times(3, async (i) => {
            return await createTestBranch({
              branch: buildBasicTestModel({
                name: `Model #${i}`
              }),
              stream: deletablesProject,
              owner: me
            })
          })
        )

        await addToStream(deletablesProject, otherGuy, Roles.Stream.Reviewer, {
          owner: me
        })
      })

      beforeEach(async () => {
        const creates = await Promise.all([createTestView(), createTestGroup()])

        deletableView = creates[0]
        deletableGroup = creates[1]
      })

      afterEach(async () => {
        await deleteView({
          input: {
            id: deletableView.id,
            projectId: deletablesProject.id
          }
        })

        await deleteSavedViewGroup({
          input: {
            groupId: deletableGroup.id,
            projectId: deletablesProject.id
          }
        })
      })

      const createTestView = async () => {
        const createRes = await createSavedView(
          buildCreateInput({
            projectId: deletablesProject.id,
            resourceIdString: models[0].id,
            overrides: { name: 'View to delete' }
          }),
          { assertNoErrors: true }
        )
        const view = createRes.data?.projectMutations.savedViewMutations.createView!
        expect(view).to.be.ok

        return view
      }

      const createTestGroup = async () => {
        const createRes = await createSavedViewGroup(
          {
            input: {
              projectId: deletablesProject.id,
              resourceIdString: models[0].id,
              groupName: 'Group to delete'
            }
          },
          { assertNoErrors: true }
        )
        const group = createRes.data?.projectMutations.savedViewMutations.createGroup!
        expect(group).to.be.ok

        return group
      }

      const findView = async (viewId: string) => {
        const foundView = await getView({
          projectId: deletablesProject.id,
          viewId
        })
        return foundView.data?.project.savedView
      }

      const findGroup = async (groupId: string) => {
        const foundGroup = await getGroup({
          projectId: deletablesProject.id,
          groupId
        })
        return foundGroup.data?.project.savedViewGroup
      }

      it('allow deleting a view', async () => {
        const foundView = await findView(deletableView.id)
        expect(foundView).to.be.ok

        const deleteRes = await deleteView(
          {
            input: {
              id: deletableView.id,
              projectId: deletablesProject.id
            }
          },
          { assertNoErrors: true }
        )
        expect(deleteRes.data?.projectMutations.savedViewMutations.deleteView).to.be
          .true

        const deletedView = await findView(deletableView.id)
        expect(deletedView).to.not.be.ok
      })

      it('should fail to delete a view if not found', async () => {
        const res = await deleteView({
          input: {
            id: 'non-existent-view-id',
            projectId: deletablesProject.id
          }
        })

        expect(res).to.haveGraphQLErrors({ code: NotFoundError.code })
        expect(res.data?.projectMutations.savedViewMutations.deleteView).to.not.be.ok
      })

      it('should support dedicated auth policy check', async () => {
        const res = await canUpdateSavedView(
          {
            projectId: deletablesProject.id,
            viewId: deletableView.id
          },
          {
            authUserId: otherGuy.id
          }
        )

        expect(res).to.not.haveGraphQLErrors()

        const data = res.data?.project.savedView.permissions.canUpdate
        expect(data?.authorized).to.be.false
        expect(data?.code).to.equal(ProjectNotEnoughPermissionsError.code)
      })

      describe('of groups', async () => {
        it('allow deleting a group', async () => {
          const deleteRes = await deleteSavedViewGroup(
            {
              input: {
                groupId: deletableGroup.id,
                projectId: deletablesProject.id
              }
            },
            { assertNoErrors: true }
          )
          expect(deleteRes.data?.projectMutations.savedViewMutations.deleteGroup).to.be
            .true

          const deletedGroup = await findGroup(deletableGroup.id)
          expect(deletedGroup).to.not.be.ok
        })

        it('should fail to delete a group if not found', async () => {
          const res = await deleteSavedViewGroup({
            input: {
              groupId: 'non-existent-group-id',
              projectId: deletablesProject.id
            }
          })

          expect(res).to.haveGraphQLErrors({ code: NotFoundError.code })
          expect(res.data?.projectMutations.savedViewMutations.deleteGroup).to.not.be.ok
        })

        it('should support dedicated auth policy check', async () => {
          const res = await canUpdateSavedViewGroup(
            {
              projectId: deletablesProject.id,
              groupId: deletableGroup.id
            },
            {
              authUserId: otherGuy.id
            }
          )

          expect(res).to.not.haveGraphQLErrors()

          const data = res.data?.project.savedViewGroup.permissions.canUpdate
          expect(data?.authorized).to.be.false
          expect(data?.code).to.equal(ProjectNotEnoughPermissionsError.code)
        })

        it('should fail to delete default group', async () => {
          const defaultGroup = await getDefaultGroup({
            projectId: deletablesProject.id,
            resourceIdString: models[0].id
          })
          const res = await deleteSavedViewGroup({
            input: {
              groupId: defaultGroup!.id,
              projectId: deletablesProject.id
            }
          })

          expect(res).to.haveGraphQLErrors({
            code: BadRequestError.code
          })
          expect(res.data?.projectMutations.savedViewMutations.deleteGroup).to.not.be.ok
        })
      })
    })

    describe('reading groups', () => {
      const NAMED_GROUP_COUNT = 13
      const SPECIAL_GROUP_COUNT = 3 // +1 ungrouped/+1 search string/+1 my empty (should not show other guys empty)
      const GROUP_COUNT = NAMED_GROUP_COUNT + SPECIAL_GROUP_COUNT

      const PAGE_COUNT = 3

      const SEARCH_STRING = 'bababooey'
      const SEARCH_STRING_VIEW_COUNT = GROUP_COUNT / 2
      const SEARCH_STRING_ITEM_COUNT = SEARCH_STRING_VIEW_COUNT + 1 // +1 for searchable group

      // const OTHER_AUTHOR_ITEM_COUNT = GROUP_COUNT / 4
      // const MY_ITEM_COUNT = GROUP_COUNT - OTHER_AUTHOR_ITEM_COUNT

      // const OTHER_AUTHOR_PRIVATE_ITEM_COUNT = OTHER_AUTHOR_ITEM_COUNT / 2
      // const OTHER_AUTHOR_PUBLIC_ITEM_COUNT =
      //   OTHER_AUTHOR_ITEM_COUNT - OTHER_AUTHOR_PRIVATE_ITEM_COUNT
      // const PUBLIC_ITEM_COUNT = MY_ITEM_COUNT + OTHER_AUTHOR_PUBLIC_ITEM_COUNT

      const SEARCHABLE_GROUP_NAME_STRING = `${SEARCH_STRING}-you-can-find-me`

      const modelIds: string[] = []
      let readTestProject: BasicTestStream
      let otherReader: BasicTestUser
      let otherReaderAdmin: BasicTestUser

      const getAllReadModelResourceIds = () =>
        ViewerRoute.resourceBuilder().addResources(
          modelIds.map((id) => new ViewerRoute.ViewerModelResource(id))
        )

      before(async () => {
        const otherReaders = await Promise.all([
          createTestUser(buildBasicTestUser({ name: 'other-reader' })),
          createTestUser(buildBasicTestUser({ name: 'other-reader-admin' }))
        ])
        otherReader = otherReaders[0]
        otherReaderAdmin = otherReaders[1]

        await Promise.all([
          assignToWorkspace(
            myProjectWorkspace,
            otherReader,
            Roles.Workspace.Member,
            WorkspaceSeatType.Editor
          ),
          assignToWorkspace(
            myProjectWorkspace,
            otherReaderAdmin,
            Roles.Workspace.Admin,
            WorkspaceSeatType.Editor
          )
        ])

        readTestProject = await createTestStream(
          buildBasicTestProject({
            name: 'read-test-project',
            workspaceId: myProjectWorkspace.id
          }),
          me
        )

        await Promise.all([
          addToStream(readTestProject, otherReader, Roles.Stream.Contributor, {
            owner: me
          }),
          addToStream(readTestProject, otherReaderAdmin, Roles.Stream.Owner, {
            owner: me
          })
        ])

        const createEmptyGroup = async (params: {
          groupName: string
          userId?: string
        }) => {
          const { groupName, userId } = params
          const model = await createTestBranch({
            branch: buildBasicTestModel({
              name: `empty model of group ${groupName}`
            }),
            stream: readTestProject,
            owner: me
          })
          modelIds.push(model.id)

          const group = await createSavedViewGroup(
            {
              input: {
                projectId: readTestProject.id,
                resourceIdString: model.id,
                groupName
              }
            },
            {
              assertNoErrors: true,
              ...(userId ? { authUserId: userId } : {})
            }
          )

          return group.data?.projectMutations.savedViewMutations.createGroup
        }

        // Create a bunch of groups (views w/ groupNames), each w/ a different model
        let includedSearchString = 0
        const createGroupView = async (groupName: string | null, idx: number) => {
          const isSearchableGroupName = groupName === SEARCHABLE_GROUP_NAME_STRING
          const useDifferentAuthor = idx % 4 === 0
          const shouldBePrivate = useDifferentAuthor && idx % (2 * 4) === 0
          const includeSearchString =
            !shouldBePrivate &&
            !isSearchableGroupName &&
            includedSearchString++ < SEARCH_STRING_VIEW_COUNT

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

          let groupId: string | null = null
          if (groupName) {
            const group = await createSavedViewGroup(
              {
                input: {
                  projectId: readTestProject.id,
                  resourceIdString,
                  groupName: includeSearchString
                    ? `${groupName} includedSearchString`
                    : groupName
                }
              },
              {
                assertNoErrors: true,
                authUserId: useDifferentAuthor ? otherReader.id : me.id
              }
            )
            groupId =
              group.data?.projectMutations.savedViewMutations.createGroup?.id || null
          }

          const viewInput = buildCreateInput({
            resourceIdString,
            projectId: readTestProject.id,
            overrides: {
              groupId,
              visibility: shouldBePrivate
                ? SavedViewVisibility.authorOnly
                : SavedViewVisibility.public,
              name: `View ${idx} ${includeSearchString ? SEARCH_STRING : ''}`
            }
          })
          return await createSavedView(viewInput, {
            assertNoErrors: true,
            authUserId: useDifferentAuthor ? otherReader.id : me.id
          })
        }

        const groupNames: Array<string | null> = times(
          NAMED_GROUP_COUNT,
          (i) => `group-${i + 1}`
        )

        // + 1 group to have a custom search string in its name
        groupNames.push(SEARCHABLE_GROUP_NAME_STRING)

        // + 1 view without a group at the end
        groupNames.push(null)

        await Promise.all(
          groupNames.map((groupName, idx) => createGroupView(groupName, idx))
        )
        await Promise.all([
          // + 1 empty group owned by me
          createEmptyGroup({ groupName: 'my empty' }),
          // + 1 empty group owned by other guy
          createEmptyGroup({ groupName: 'other empty', userId: otherReader.id })
        ])
      })

      it('should get NotFoundError if trying to get nonexistant group', async () => {
        const res = await getGroup({
          groupId: 'zabababababababa',
          projectId: readTestProject.id
        })

        expect(res).to.haveGraphQLErrors({ code: NotFoundError.code })
        expect(res.data?.project.savedViewGroup).to.not.be.ok
      })

      it('returns no groups, not even default one, if no views exist', async () => {
        const res = await getProjectViewGroups({
          projectId: readTestProject.id,
          input: {
            limit: GROUP_COUNT, // all in 1 page
            resourceIdString: 'zabababababababa'
          }
        })

        expect(res).to.not.haveGraphQLErrors()

        const data = res.data?.project.savedViewGroups
        expect(data).to.be.ok
        expect(data!.totalCount).to.equal(0)
        expect(data!.items.length).to.equal(0)
        expect(data!.cursor).to.be.null
      })

      it('should successfully read a projects view groups w/ pagination', async () => {
        let cursor: string | null = null
        let pagesLoaded = 0
        let groupsFound = 0
        let defaultGroupsFound = 0
        const allReadModelResourceIds = getAllReadModelResourceIds()
        const PAGE_SIZE = Math.ceil(GROUP_COUNT / PAGE_COUNT)

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

          const defaultGroupsInResult = data?.items.filter(
            (group) => group.isUngroupedViewsGroup
          )
          defaultGroupsFound += defaultGroupsInResult?.length || 0

          const allResourceIds = allReadModelResourceIds
            .toResources()
            .map((r) => r.toString())
          for (const group of data!.items) {
            expect(group.projectId).to.equal(readTestProject.id)
            expect(
              intersection(group.resourceIds, allResourceIds).length
            ).to.be.greaterThan(0)
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
        expect(defaultGroupsFound).to.equal(1) // only 1 default group
      })

      it('should support default groups cursor', async () => {
        const res1 = await getProjectViewGroups(
          {
            projectId: readTestProject.id,
            input: {
              limit: 1, // only get default group
              resourceIdString: getAllReadModelResourceIds().toString()
            }
          },
          { assertNoErrors: true }
        )

        const group = res1.data?.project.savedViewGroups.items[0]
        const cursor = res1.data?.project.savedViewGroups.cursor

        expect(group).to.be.ok
        expect(group!.isUngroupedViewsGroup).to.be.true
        expect(cursor).to.be.ok

        const res2 = await getProjectViewGroups(
          {
            projectId: readTestProject.id,
            input: {
              limit: 1, // get first real item
              resourceIdString: getAllReadModelResourceIds().toString(),
              cursor
            }
          },
          { assertNoErrors: true }
        )

        const group2 = res2.data?.project.savedViewGroups.items[0]

        expect(group2).to.be.ok
        expect(group2!.isUngroupedViewsGroup).to.be.false
      })

      it('should respect search filter and filter out by group/view name', async () => {
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

        // should have found a bunch of groups because of their view names
        // and one group because of its own name
        const searchableGroup = data?.items.find(
          (i) => i.title === SEARCHABLE_GROUP_NAME_STRING
        )
        expect(searchableGroup).to.be.ok

        const searchableViewGroups = data?.items.filter((i) =>
          i.title.includes('includedSearchString')
        )

        expect(searchableViewGroups).to.have.lengthOf(SEARCH_STRING_VIEW_COUNT)
      })

      it('should respect onlyAuthored flag', async () => {
        const res = await getProjectViewGroups({
          projectId: readTestProject.id,
          input: {
            limit: GROUP_COUNT, // all in 1 page
            resourceIdString: getAllReadModelResourceIds().toString(),
            onlyAuthored: true
          },
          viewsInput: {
            onlyAuthored: true
          }
        })

        expect(res).to.not.haveGraphQLErrors()

        const data = res.data?.project.savedViewGroups
        expect(data).to.be.ok

        // all groups are gonna be returned, except default
        const expectedCount = GROUP_COUNT
        expect(data!.totalCount).to.equal(expectedCount)
        expect(data!.items.length).to.equal(expectedCount)

        // but their views are filtered
        for (const item of data!.items) {
          const otherAuthor = item.views.items.find((i) => i.author?.id !== me.id)
          expect(otherAuthor).to.not.be.ok
        }
      })

      itEach(
        [SavedViewVisibility.authorOnly, SavedViewVisibility.public],
        (visibility) => `should respect onlyVisibility === ${visibility}`,
        async (onlyVisibility) => {
          const isPrivate = onlyVisibility === SavedViewVisibility.authorOnly
          const res = await getProjectViewGroups(
            {
              projectId: readTestProject.id,
              input: {
                limit: GROUP_COUNT, // all in 1 page
                resourceIdString: getAllReadModelResourceIds().toString(),
                onlyVisibility
              },
              viewsInput: {
                onlyVisibility
              }
            },
            {
              authUserId: otherReader.id
            }
          )

          expect(res).to.not.haveGraphQLErrors()

          const expectedCount = isPrivate ? GROUP_COUNT - 1 : GROUP_COUNT
          const data = res.data?.project.savedViewGroups
          expect(data).to.be.ok
          expect(data!.totalCount).to.equal(expectedCount)
          expect(data!.items.length).to.equal(expectedCount)

          expect(
            data!.items.every((i) =>
              i.views.items.every((v) => v.visibility === onlyVisibility)
            )
          ).to.be.true
        }
      )

      it('can retrieve default group both by id and also ungroupedViewGroup query', async () => {
        const allGroupsRes = await getProjectViewGroups(
          {
            projectId: readTestProject.id,
            input: {
              limit: GROUP_COUNT, // all in 1 page
              resourceIdString: getAllReadModelResourceIds().toString()
            }
          },
          { assertNoErrors: true }
        )

        const defaultGroup = allGroupsRes.data?.project.savedViewGroups.items.find(
          (g) => g.isUngroupedViewsGroup
        )
        expect(defaultGroup).to.be.ok
        expect(defaultGroup!.views.items.length).to.equal(1) // 1 view in there

        const defaultGroupViewId = defaultGroup!.views.items[0].id
        expect(defaultGroupViewId).to.be.ok

        const groupById = await getGroup(
          {
            projectId: readTestProject.id,
            groupId: defaultGroup!.id
          },
          { assertNoErrors: true }
        )
        const groupByIdData = groupById.data?.project.savedViewGroup
        expect(groupByIdData).to.be.ok
        expect(groupByIdData!.id).to.equal(defaultGroup!.id)
        expect(groupByIdData!.isUngroupedViewsGroup).to.be.true
        expect(groupByIdData!.views.items.length).to.equal(1) // 1 view in there
        expect(groupByIdData!.views.items[0].id).to.equal(defaultGroupViewId)

        const ungroupedGroup = await getProjectUngroupedViewGroup(
          {
            projectId: readTestProject.id,
            input: { resourceIdString: getAllReadModelResourceIds().toString() }
          },
          { assertNoErrors: true }
        )
        const ungroupedGroupData = ungroupedGroup.data?.project.ungroupedViewGroup
        expect(ungroupedGroupData).to.be.ok
        expect(ungroupedGroupData!.id).to.equal(defaultGroup!.id)
        expect(ungroupedGroupData!.isUngroupedViewsGroup).to.be.true
        expect(ungroupedGroupData!.views.items.length).to.equal(1) // 1 view in there
        expect(ungroupedGroupData!.views.items[0].id).to.equal(defaultGroupViewId)
      })

      describe('views', () => {
        let myFirstGroup: BasicSavedViewGroupFragment
        const myFirstGroupViews: BasicSavedViewFragment[] = []

        const VIEW_COUNT = GROUP_COUNT
        const OTHER_USER_VIEW_COUNT = VIEW_COUNT / 2
        const OTHER_USER_PRIVATE_VIEW_COUNT = OTHER_USER_VIEW_COUNT / 2
        const PUBLIC_VIEW_COUNT = VIEW_COUNT - OTHER_USER_PRIVATE_VIEW_COUNT

        const SEARCH_STRING = 'babab123'
        const SEARCHABLE_VIEW_COUNT = PUBLIC_VIEW_COUNT / 3

        /**
         * Similar to 'reading groups' - create a test group and a bunch of views in it, based on const params,
         * and then do various tests there
         */

        before(async () => {
          // Create new group
          const group = await createSavedViewGroup(
            {
              input: {
                projectId: readTestProject.id,
                resourceIdString: ViewerRoute.resourceBuilder()
                  .addModel(modelIds[0])
                  .toString(),
                groupName: 'My First Views Test Group'
              }
            },
            {
              assertNoErrors: true
            }
          )
          myFirstGroup = group.data?.projectMutations.savedViewMutations.createGroup!

          // Create a bunch of views, one for each modelId
          // Serial creation for ordered dates
          for (let i = 0; i < modelIds.length; i++) {
            const modelId = modelIds[i]
            const idx = i + 1 // 1-based index for naming

            const shouldBeOtherUser = i % 2 === 0
            const shouldBePrivate = shouldBeOtherUser && i % 4 === 0
            const shouldAddSearchString = !shouldBePrivate && i % 3 === 0

            const res = await createSavedView(
              buildCreateInput({
                resourceIdString: ViewerRoute.resourceBuilder()
                  .addModel(modelId)
                  .toString(),
                projectId: readTestProject.id,
                overrides: {
                  groupId: myFirstGroup.id,
                  name: `Grouped View ${shouldAddSearchString ? SEARCH_STRING : ''} #${
                    idx + 1
                  }`,
                  visibility: shouldBePrivate
                    ? SavedViewVisibility.authorOnly
                    : SavedViewVisibility.public
                }
              }),
              {
                assertNoErrors: true,
                authUserId: shouldBeOtherUser ? otherReader.id : me.id
              }
            )
            const view = res.data?.projectMutations.savedViewMutations.createView
            myFirstGroupViews.push(view!)
          }
        })

        it('should fail to read private view, even as workspace admin/project owner', async () => {
          const view = myFirstGroupViews.find(
            (v) =>
              v.author?.id !== otherReaderAdmin.id &&
              v.visibility === SavedViewVisibility.authorOnly
          )
          expect(view).to.be.ok

          const res = await getView(
            {
              projectId: readTestProject.id,
              viewId: view!.id
            },
            { authUserId: otherReaderAdmin.id }
          )

          expect(res).to.haveGraphQLErrors({ code: ForbiddenError.code })
          expect(res.data?.project.savedView).to.not.be.ok

          const res2 = await getViewIfExists(
            {
              projectId: readTestProject.id,
              viewId: view!.id
            },
            { authUserId: otherReaderAdmin.id }
          )

          expect(res2).to.haveGraphQLErrors({ code: ForbiddenError.code })
          expect(res2.data?.project.savedViewIfExists).to.not.be.ok
        })

        itEach(
          [{ savedViewIfExists: false }, { savedViewIfExists: true }],
          ({ savedViewIfExists }) =>
            `should successfully read specific view (w/ ${
              savedViewIfExists ? 'savedViewIfExists' : 'savedView '
            })`,
          async ({ savedViewIfExists }) => {
            const view = myFirstGroupViews.find((v) => v.author?.id === me.id)!

            let data: BasicSavedViewFragment | undefined = undefined
            if (savedViewIfExists) {
              const res = await getViewIfExists(
                {
                  projectId: readTestProject.id,
                  viewId: view.id
                },
                { assertNoErrors: true }
              )

              data = res.data?.project.savedViewIfExists || undefined
            } else {
              const res = await getView(
                {
                  projectId: readTestProject.id,
                  viewId: view.id
                },
                { assertNoErrors: true }
              )

              data = res.data?.project.savedView
            }

            expect(data).to.be.ok
            expect(data!.id).to.equal(view.id)
            expect(data!.name).to.equal(view.name)
            expect(data!.description).to.equal(view.description)
            expect(data!.author?.id).to.equal(view.author?.id)
            expect(data!.groupId).to.equal(view.groupId)
            expect(data!.createdAt.toISOString()).to.equal(view.createdAt.toISOString())
            expect(data!.group.id).to.equal(myFirstGroup.id)
          }
        )

        it('should get NotFoundError if trying to get nonexistant view', async () => {
          const res = await getView({
            projectId: readTestProject.id,
            viewId: 'zabababababababa'
          })

          expect(res).to.haveGraphQLErrors({ code: NotFoundError.code })
          expect(res.data?.project.savedView).to.not.be.ok
        })

        it('should not get errors if trying to get nonexistant view through savedViewIfExists', async () => {
          const res = await getViewIfExists({
            projectId: readTestProject.id,
            viewId: 'zabababababababa'
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.project.savedViewIfExists).to.eq(null)
        })

        it('should successfully read a group with its views', async () => {
          const res = await getGroup(
            {
              projectId: readTestProject.id,
              groupId: myFirstGroup.id,
              viewsInput: {
                limit: 100 // all in 1 page
              }
            },
            { assertNoErrors: true }
          )

          const data = res.data?.project.savedViewGroup
          expect(data).to.be.ok
          expect(data!.id).to.equal(myFirstGroup.id)
          expect(data!.title).to.equal(myFirstGroup.title)
          expect(data!.resourceIds).to.deep.equalInAnyOrder(
            getAllReadModelResourceIds().map((r) => r.toString())
          )

          const views = data!.views
          expect(views).to.be.ok
          expect(views.totalCount).to.equal(PUBLIC_VIEW_COUNT)
          expect(views.items.length).to.equal(PUBLIC_VIEW_COUNT)

          for (const view of views.items) {
            expect(view.groupId).to.equal(myFirstGroup.id)
            expect(view.projectId).to.equal(readTestProject.id)
            expect(view.resourceIds.length).to.equal(1)

            const resourceId = view.resourceIds[0]
            expect(modelIds.includes(resourceId)).to.be.true
          }
        })

        it('should handle pagination', async () => {
          let cursor: string | null = null
          let pagesLoaded = 0
          let viewsFound = 0
          const allReadModelResourceIds = getAllReadModelResourceIds()
          const PAGE_SIZE = Math.ceil(PUBLIC_VIEW_COUNT / PAGE_COUNT)

          const loadPage = async () => {
            const res = await getGroup(
              {
                projectId: readTestProject.id,
                groupId: myFirstGroup.id,
                viewsInput: {
                  limit: PAGE_SIZE,
                  cursor
                }
              },
              { assertNoErrors: true }
            )

            expect(res).to.not.haveGraphQLErrors()

            const data = res.data?.project.savedViewGroup.views
            expect(data).to.be.ok
            expect(data!.totalCount).to.equal(PUBLIC_VIEW_COUNT)

            if (data?.cursor) {
              expect(data!.items.length).to.be.lessThanOrEqual(PAGE_SIZE)
            } else {
              expect(data!.items.length).to.eq(0)
            }

            const allResourceIds = allReadModelResourceIds
              .toResources()
              .map((r) => r.toString())
            for (const view of data!.items) {
              expect(view.projectId).to.equal(readTestProject.id)
              expect(
                intersection(view.resourceIds, allResourceIds).length
              ).to.be.greaterThan(0)
              viewsFound++
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
          expect(viewsFound).to.equal(PUBLIC_VIEW_COUNT)
        })

        it('should respect onlyAuthored flag', async () => {
          const res = await getGroup(
            {
              projectId: readTestProject.id,
              groupId: myFirstGroup.id,
              viewsInput: {
                limit: 100, // all in 1 page
                onlyAuthored: true
              }
            },
            { assertNoErrors: true, authUserId: otherReader.id }
          )

          const data = res.data?.project.savedViewGroup.views
          expect(data).to.be.ok
          expect(data!.totalCount).to.equal(OTHER_USER_VIEW_COUNT + 1) // +1 otherReader empty group
          expect(data!.items.length).to.equal(OTHER_USER_VIEW_COUNT + 1)
          expect(data!.items.every((v) => v.author?.id === otherReader.id)).to.be.true
        })

        it('should respect search filter', async () => {
          const res = await getGroup(
            {
              projectId: readTestProject.id,
              groupId: myFirstGroup.id,
              viewsInput: {
                limit: 100, // all in 1 page
                search: SEARCH_STRING
              }
            },
            { assertNoErrors: true }
          )

          const data = res.data?.project.savedViewGroup.views
          expect(data).to.be.ok
          expect(data!.totalCount).to.equal(SEARCHABLE_VIEW_COUNT)
          expect(data!.items.length).to.equal(SEARCHABLE_VIEW_COUNT)

          for (const view of data!.items) {
            expect(view.name.includes(SEARCH_STRING)).to.be.true
          }
        })

        it('should allow sorting by name asc', async () => {
          const res = await getGroup(
            {
              projectId: readTestProject.id,
              groupId: myFirstGroup.id,
              viewsInput: {
                limit: 100, // all in 1 page
                sortBy: 'name',
                sortDirection: 'ASC'
              }
            },
            { assertNoErrors: true }
          )

          const data = res.data?.project.savedViewGroup.views
          expect(data).to.be.ok
          expect(data!.items.length).to.equal(PUBLIC_VIEW_COUNT)

          const names = data!.items.map((v) => v.name)
          const sortedNames = [...names].sort()
          expect(names).to.deep.equal(sortedNames)
        })

        it('should allow sorting by createdAt desc', async () => {
          const res = await getGroup(
            {
              projectId: readTestProject.id,
              groupId: myFirstGroup.id,
              viewsInput: {
                limit: 100, // all in 1 page
                sortBy: 'createdAt',
                sortDirection: 'DESC'
              }
            },
            { assertNoErrors: true }
          )

          const data = res.data?.project.savedViewGroup.views
          expect(data).to.be.ok
          expect(data!.items.length).to.equal(PUBLIC_VIEW_COUNT)

          const createdAt = data!.items.map((v) => dayjs(v.createdAt))
          const sortedCreatedAt = [...createdAt].sort((a, b) => (b.isAfter(a) ? 1 : -1))
          expect(createdAt).to.deep.equal(sortedCreatedAt)
        })
      })
    })
  } else {
    it('should not allowing creating a group if workspaces are disabled', async () => {
      const resourceIds = model1ResourceIds()
      const resourceIdString = resourceIds.toString()

      const res = await createSavedViewGroup({
        input: {
          projectId: myProject.id,
          resourceIdString,
          groupName: 'Test Group'
        }
      })

      expect(res).to.haveGraphQLErrors({
        code: ForbiddenError.code
      })
      expect(res.data?.projectMutations.savedViewMutations.createGroup).to.not.be.ok
    })

    it('should not allowing creating a view if workspaces are disabled', async () => {
      const resourceIds = model1ResourceIds()
      const resourceIdString = resourceIds.toString()

      const res = await createSavedView({
        input: {
          projectId: myProject.id,
          resourceIdString,
          name: 'Test View',
          screenshot: fakeScreenshot,
          viewerState: fakeViewerState()
        }
      })

      expect(res).to.haveGraphQLErrors({
        code: ForbiddenError.code
      })
      expect(res.data?.projectMutations.savedViewMutations.createView).to.not.be.ok
    })
  }
})
