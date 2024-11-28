/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addBranchUpdatedActivityFactory } from '@/modules/activitystream/services/branchActivity'
import {
  addStreamDeletedActivityFactory,
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory,
  addStreamPermissionsRevokedActivityFactory,
  addStreamUpdatedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  getBranchByIdFactory,
  updateBranchFactory
} from '@/modules/core/repositories/branches'
import {
  deleteStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  grantStreamPermissionsFactory,
  revokeStreamPermissionsFactory,
  updateStreamFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { updateBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import {
  deleteStreamAndNotifyFactory,
  updateStreamAndNotifyFactory
} from '@/modules/core/services/streams/management'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { deleteAllResourceInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { authorizeResolver } from '@/modules/shared'
import { publish } from '@/modules/shared/utils/subscriptions'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnBranchCreatedDocument,
  OnBranchUpdatedDocument,
  OnProjectModelsUpdatedDocument,
  OnProjectUpdatedDocument,
  OnStreamUpdatedDocument,
  OnUserProjectsUpdatedDocument,
  OnUserProjectVersionsUpdatedDocument,
  OnUserStreamAddedDocument,
  OnUserStreamCommitCreatedDocument,
  OnUserStreamRemovedDocument,
  ProjectUpdatedMessageType,
  UserProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext, getMainTestRegionKey } from '@/test/hooks'
import {
  BasicTestBranch,
  createTestBranch,
  createTestBranches
} from '@/test/speckle-helpers/branchHelper'
import { BasicTestCommit, createTestCommits } from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { faker } from '@faker-js/faker'
import { Optional, Roles, Scopes, ServerScope } from '@speckle/shared'
import { expect } from 'chai'

const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream: getStreamFactory({ db })
})

const buildDeleteProject = async (params: { projectId: string; ownerId: string }) => {
  const { projectId, ownerId } = params
  const projectDb = await getProjectDbClient({ projectId })
  const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
    deleteStream: deleteStreamFactory({
      db: projectDb
    }),
    authorizeResolver,
    addStreamDeletedActivity: addStreamDeletedActivityFactory({
      saveActivity,
      publish,
      getStreamCollaborators: getStreamCollaboratorsFactory({ db })
    }),
    deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
    getStream: getStreamFactory({ db: projectDb })
  })
  return async () => deleteStreamAndNotify(projectId, ownerId, null)
}

const buildUpdateProject = async (params: { projectId: string }) => {
  const { projectId } = params
  const projectDB = await getProjectDbClient({ projectId })
  const updateStreamAndNotify = updateStreamAndNotifyFactory({
    authorizeResolver,
    getStream: getStreamFactory({ db: projectDB }),
    updateStream: updateStreamFactory({ db: projectDB }),
    addStreamUpdatedActivity: addStreamUpdatedActivityFactory({
      saveActivity,
      publish
    })
  })
  return updateStreamAndNotify
}

const buildUpdateModel = async (params: { projectId: string }) => {
  const { projectId } = params
  const projectDB = await getProjectDbClient({ projectId })
  const updateBranchAndNotify = updateBranchAndNotifyFactory({
    getBranchById: getBranchByIdFactory({ db: projectDB }),
    updateBranch: updateBranchFactory({ db: projectDB }),
    addBranchUpdatedActivity: addBranchUpdatedActivityFactory({
      saveActivity: saveActivityFactory({ db }),
      publish
    })
  })
  return updateBranchAndNotify
}

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser: getUserFactory({ db }),
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
})

const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  addStreamPermissionsRevokedActivity: addStreamPermissionsRevokedActivityFactory({
    saveActivity,
    publish
  })
})

describe('Core GraphQL Subscriptions (New)', () => {
  let me: BasicTestUser
  let otherGuy: BasicTestUser
  let subServer: TestApolloSubscriptionServer
  let meSubClient: TestApolloSubscriptionClient

  before(async () => {
    await beforeEachContext()
    me = await createTestUser()
    otherGuy = await createTestUser()
    subServer = await testApolloSubscriptionServer()
    meSubClient = await subServer.buildClient({ authUserId: me.id })
  })

  after(async () => {
    subServer.quit()
  })

  const modes = [
    { isMultiRegion: false },
    ...(isMultiRegionTestMode() ? [{ isMultiRegion: true }] : [])
  ]

  modes.forEach(({ isMultiRegion }) => {
    describe(`W/${!isMultiRegion ? 'o' : ''} multiregion`, () => {
      const myMainWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: '',
        name: 'My Main Workspace'
      }

      before(async () => {
        await createTestWorkspace(myMainWorkspace, me, {
          regionKey: isMultiRegion ? getMainTestRegionKey() : undefined
        })
        if (isMultiRegion) {
          await Promise.all([
            waitForRegionUser({ userId: me.id }),
            waitForRegionUser({ userId: otherGuy.id })
          ])
        }
      })

      describe('Project Subs', () => {
        describe('scope tests', () => {
          const randomProject: BasicTestStream = {
            name: 'Scope test project',
            id: '',
            ownerId: '',
            isPublic: true
          }
          let testClient: Optional<TestApolloSubscriptionClient> = undefined

          before(async () => {
            randomProject.workspaceId = myMainWorkspace.id
            await createTestStreams([[randomProject, me]])
          })

          afterEach(async () => {
            testClient?.quit()
          })

          type ScopeTest = {
            title: string
            withoutScope: ServerScope
            sub: () => {
              query: any
              variables: any
            }
            triggerMessage: () => Promise<void>
          }

          const triggerProjectUpdate = async () => {
            const projectId = randomProject.id
            const updateProject = await buildUpdateProject({ projectId })
            await updateProject(
              { id: projectId, name: new Date().toISOString() },
              me.id,
              null
            )
          }

          const scopeTests: ScopeTest[] = [
            {
              title: 'streamUpdated()',
              withoutScope: Scopes.Streams.Read,
              sub: () => ({
                query: OnStreamUpdatedDocument,
                variables: { streamId: randomProject.id }
              }),
              triggerMessage: triggerProjectUpdate
            },
            {
              title: 'projectUpdated()',
              withoutScope: Scopes.Streams.Read,
              sub: () => ({
                query: OnProjectUpdatedDocument,
                variables: { projectId: randomProject.id }
              }),
              triggerMessage: triggerProjectUpdate
            },
            {
              title: 'userProjectsUpdated()',
              withoutScope: Scopes.Profile.Read,
              sub: () => ({
                query: OnUserProjectsUpdatedDocument,
                variables: {}
              }),
              triggerMessage: async () => {
                // Create a new project
                const newProject: BasicTestStream = {
                  name: 'New Scope Test Project',
                  id: '',
                  ownerId: me.id,
                  isPublic: true,
                  workspaceId: myMainWorkspace.id
                }

                await createTestStreams([[newProject, me]])
              }
            }
          ]

          scopeTests.forEach(({ title, withoutScope, sub, triggerMessage }) => {
            itEach(
              [{ allow: false }, { allow: true }],
              ({ allow }) =>
                `should ${allow ? '' : 'not '} allow ${title} sub with${
                  !allow ? 'out' : ''
                } ${withoutScope} scope`,
              async ({ allow }) => {
                testClient = await subServer.buildClient({
                  authUserId: me.id,
                  scopes: allow
                    ? AllScopes
                    : AllScopes.filter((s) => s !== withoutScope)
                })

                const { query, variables } = sub()
                const onMessage = await testClient.subscribe(
                  query,
                  variables,
                  (res) => {
                    if (allow) {
                      expect(res).to.not.haveGraphQLErrors()
                    } else {
                      expect(res).to.haveGraphQLErrors(
                        'Your auth token does not have the required scope'
                      )
                    }
                  }
                )
                await testClient.waitForReadiness()

                await triggerMessage()
                await onMessage.waitForMessage()

                expect(onMessage.getMessages()).to.have.length(1)
              }
            )
          })
        })

        it('should notify me of a new project (userProjectsUpdated/userStreamAdded)', async () => {
          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnUserProjectsUpdatedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userProjectsUpdated.type).to.equal(
                UserProjectsUpdatedMessageType.Added
              )
              expect(res.data?.userProjectsUpdated.project?.name).to.equal(myProj.name)
            }
          )
          const onUserStreamAdded = await meSubClient.subscribe(
            OnUserStreamAddedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userStreamAdded?.name).to.equal(myProj.name)
            }
          )
          await meSubClient.waitForReadiness()

          const myProj: BasicTestStream = {
            name: 'My New Test1 Project',
            id: '',
            ownerId: me.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          const otherGuysProj: BasicTestStream = {
            name: 'Other Guys Project',
            id: '',
            ownerId: otherGuy.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([
            [myProj, me],
            [otherGuysProj, otherGuy]
          ])
          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onUserStreamAdded.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamAdded.getMessages()).to.have.length(1)
        })

        it('should notify me of a project ive just been added to (userProjectsUpdated/userStreamAdded)', async () => {
          const otherGuysProj: BasicTestStream = {
            name: 'Other Guys Project #1',
            id: '',
            ownerId: otherGuy.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([[otherGuysProj, otherGuy]])

          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnUserProjectsUpdatedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userProjectsUpdated.type).to.equal(
                UserProjectsUpdatedMessageType.Added
              )
              expect(res.data?.userProjectsUpdated.project?.id).to.equal(
                otherGuysProj.id
              )
            }
          )
          const onUserStreamAdded = await meSubClient.subscribe(
            OnUserStreamAddedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userStreamAdded?.id).to.equal(otherGuysProj.id)
            }
          )
          await meSubClient.waitForReadiness()
          await meSubClient.waitForReadiness()
          await meSubClient.waitForReadiness()
          await meSubClient.waitForReadiness()

          await addOrUpdateStreamCollaborator(
            otherGuysProj.id,
            me.id,
            Roles.Stream.Contributor,
            otherGuy.id
          )

          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onUserStreamAdded.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamAdded.getMessages()).to.have.length(1)
        })

        it('should notify me of a removed project (userProjectsUpdated/userStreamRemoved)', async () => {
          const myProj: BasicTestStream = {
            name: 'My New Test2 Project',
            id: '',
            ownerId: me.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([[myProj, me]])
          const deleteProject = await buildDeleteProject({
            projectId: myProj.id,
            ownerId: me.id
          })

          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnUserProjectsUpdatedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userProjectsUpdated.type).to.equal(
                UserProjectsUpdatedMessageType.Removed
              )
              expect(res.data?.userProjectsUpdated.id).to.equal(myProj.id)
            }
          )
          const onUserStreamRemoved = await meSubClient.subscribe(
            OnUserStreamRemovedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userStreamRemoved?.id).to.equal(myProj.id)
            }
          )
          await meSubClient.waitForReadiness()
          await deleteProject()

          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onUserStreamRemoved.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamRemoved.getMessages()).to.have.length(1)
        })

        it('should notify me of a project ive just been removed from (userProjectsUpdated/userStreamRemoved)', async () => {
          const otherGuysProj: BasicTestStream = {
            name: 'Other Guys Project #2',
            id: '',
            ownerId: otherGuy.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([[otherGuysProj, otherGuy]])
          await addOrUpdateStreamCollaborator(
            otherGuysProj.id,
            me.id,
            Roles.Stream.Contributor,
            otherGuy.id
          )

          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnUserProjectsUpdatedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userProjectsUpdated.type).to.equal(
                UserProjectsUpdatedMessageType.Removed
              )
              expect(res.data?.userProjectsUpdated.id).to.equal(otherGuysProj.id)
            }
          )
          const onUserStreamRemoved = await meSubClient.subscribe(
            OnUserStreamRemovedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userStreamRemoved?.id).to.equal(otherGuysProj.id)
            }
          )
          await meSubClient.waitForReadiness()
          await removeStreamCollaborator(otherGuysProj.id, me.id, otherGuy.id, null)

          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onUserStreamRemoved.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamRemoved.getMessages()).to.have.length(1)
        })

        it('should notify me of a project update (projectUpdated/streamUpdate)', async () => {
          const myProj: BasicTestStream = {
            name: 'My New Test3 Project',
            id: '',
            ownerId: me.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([[myProj, me]])
          const updateProject = await buildUpdateProject({ projectId: myProj.id })

          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnProjectUpdatedDocument,
            { projectId: myProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.projectUpdated.type).to.equal(
                ProjectUpdatedMessageType.Updated
              )
              expect(res.data?.projectUpdated.project?.id).to.equal(myProj.id)
            }
          )
          const onStreamUpdated = await meSubClient.subscribe(
            OnStreamUpdatedDocument,
            { streamId: myProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.streamUpdated?.id).to.equal(myProj.id)
            }
          )
          await meSubClient.waitForReadiness()
          await updateProject(
            { id: myProj.id, name: 'Updated Project Name' },
            me.id,
            null
          )

          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onStreamUpdated.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onStreamUpdated.getMessages()).to.have.length(1)
        })

        it('should not notify me of a project update for a different project', async () => {
          const myProj: BasicTestStream = {
            name: 'My New Test4 Project',
            id: '',
            ownerId: me.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([[myProj, me]])
          const updateProject = await buildUpdateProject({ projectId: myProj.id })

          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnProjectUpdatedDocument,
            { projectId: 'aaa' },
            () => {
              throw new Error('Message received for wrong project')
            }
          )
          const onStreamUpdated = await meSubClient.subscribe(
            OnStreamUpdatedDocument,
            { streamId: 'bbb' },
            () => {
              throw new Error('Message received for wrong project')
            }
          )
          await meSubClient.waitForReadiness()
          await updateProject(
            { id: myProj.id, name: 'Updated Project Name' },
            me.id,
            null
          )

          await Promise.all([
            onUserProjectsUpdated.waitForTimeout(),
            onStreamUpdated.waitForTimeout()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(0)
          expect(onStreamUpdated.getMessages()).to.have.length(0)
        })
      })

      describe('Version Subs', () => {
        const myVersionProj: BasicTestStream = {
          name: 'My New Version Project #1',
          id: '',
          ownerId: '',
          isPublic: true
        }

        before(async () => {
          myVersionProj.workspaceId = myMainWorkspace.id
          await createTestStreams([[myVersionProj, me]])
        })

        it(`should notify me of a new version (projectVersionsUpdated/commitCreated)`, async () => {
          const message = 'ayyyooo'
          const onUserProjectVersionsUpdated = await meSubClient.subscribe(
            OnUserProjectVersionsUpdatedDocument,
            { projectId: myVersionProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.projectVersionsUpdated.version?.message).to.equal(
                message
              )
            }
          )
          const onUserStreamCommitCreated = await meSubClient.subscribe(
            OnUserStreamCommitCreatedDocument,
            { streamId: myVersionProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.commitCreated?.message).to.equal(message)
            }
          )
          await meSubClient.waitForReadiness()

          // Create test commit
          const commit: BasicTestCommit = {
            streamId: '',
            objectId: '',
            id: '',
            authorId: '',
            message
          }

          await createTestCommits([commit], { owner: me, stream: myVersionProj })

          await Promise.all([
            onUserProjectVersionsUpdated.waitForMessage(),
            onUserStreamCommitCreated.waitForMessage()
          ])

          expect(onUserProjectVersionsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamCommitCreated.getMessages()).to.have.length(1)
        })
      })

      describe('Model Subs', () => {
        const myModelProj: BasicTestStream = {
          name: 'My New Model Project #1',
          id: '',
          ownerId: '',
          isPublic: true
        }

        before(async () => {
          myModelProj.workspaceId = myMainWorkspace.id
          await createTestStreams([[myModelProj, me]])
        })

        it(`should notify me of a new model (projectModelsUpdated/branchCreated)`, async () => {
          const newModel: BasicTestBranch = {
            name: 'Some New Fangled kind of Model',
            streamId: '',
            authorId: '',
            id: ''
          }

          const onProjectModelsUpdated = await meSubClient.subscribe(
            OnProjectModelsUpdatedDocument,
            { projectId: myModelProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()

              // name should be lowercaseified
              expect(res.data?.projectModelsUpdated.model?.name).to.equal(
                newModel.name.toLowerCase()
              )
            }
          )
          const onBranchCreated = await meSubClient.subscribe(
            OnBranchCreatedDocument,
            { streamId: myModelProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.branchCreated?.name).to.equal(
                newModel.name.toLowerCase()
              )
            }
          )
          await meSubClient.waitForReadiness()

          await createTestBranch({ branch: newModel, stream: myModelProj, owner: me })
          await Promise.all([
            onProjectModelsUpdated.waitForMessage(),
            onBranchCreated.waitForMessage()
          ])

          expect(onProjectModelsUpdated.getMessages()).to.have.length(1)
          expect(onBranchCreated.getMessages()).to.have.length(1)
        })

        itEach(
          [{ any: false }, { any: true }],
          ({ any }) =>
            `should notify me of ${
              any ? 'any ' : ''
            }updated model (projectModelsUpdated/branchUpdated)`,
          async ({ any }) => {
            // Create 2 models
            const firstModel: BasicTestBranch = {
              name: 'First Model ' + faker.number.int(),
              streamId: '',
              authorId: '',
              id: ''
            }
            const secondModel: BasicTestBranch = {
              name: 'Second Model ' + faker.number.int(),
              streamId: '',
              authorId: '',
              id: ''
            }
            await createTestBranches([
              { branch: firstModel, stream: myModelProj, owner: me },
              { branch: secondModel, stream: myModelProj, owner: me }
            ])
            const updateModel = await buildUpdateModel({ projectId: myModelProj.id })

            // Sub
            const onProjectModelsUpdated = await meSubClient.subscribe(
              OnProjectModelsUpdatedDocument,
              {
                projectId: myModelProj.id,
                ...(!any ? { modelIds: [firstModel.id] } : {})
              },
              (res) => {
                expect(res).to.not.haveGraphQLErrors()

                const modelId = res.data?.projectModelsUpdated.model?.id
                expect([firstModel.id, ...(any ? [secondModel.id] : [])]).to.include(
                  modelId
                )
              }
            )
            const onBranchUpdated = await meSubClient.subscribe(
              OnBranchUpdatedDocument,
              {
                streamId: myModelProj.id,
                branchId: !any ? firstModel.id : undefined
              },
              (res) => {
                expect(res).to.not.haveGraphQLErrors()
                const modelId = res.data?.branchUpdated?.id
                expect([firstModel.id, ...(any ? [secondModel.id] : [])]).to.include(
                  modelId
                )
              }
            )
            await meSubClient.waitForReadiness()

            // Update both models
            await Promise.all([
              updateModel(
                {
                  id: firstModel.id,
                  name: 'First Model New Name' + faker.number.int(),
                  projectId: myModelProj.id
                },
                me.id
              ),
              updateModel(
                {
                  id: secondModel.id,
                  name: 'Second Model New Name' + faker.number.int(),
                  projectId: myModelProj.id
                },
                me.id
              )
            ])

            await Promise.all([
              onProjectModelsUpdated.waitForMessage(),
              onBranchUpdated.waitForMessage()
            ])

            expect(onProjectModelsUpdated.getMessages()).to.have.length(any ? 2 : 1)
            expect(onBranchUpdated.getMessages()).to.have.length(any ? 2 : 1)
          }
        )
      })
    })
  })
})
