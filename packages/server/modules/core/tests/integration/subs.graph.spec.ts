import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamDeletedActivityFactory,
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import {
  deleteStreamFactory,
  getStreamCollaboratorsFactory,
  getStreamFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { deleteStreamAndNotifyFactory } from '@/modules/core/services/streams/management'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { deleteAllResourceInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { authorizeResolver } from '@/modules/shared'
import { publish } from '@/modules/shared/utils/subscriptions'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnUserProjectsUpdatedDocument,
  OnUserProjectVersionsUpdatedDocument,
  OnUserStreamAddedDocument,
  OnUserStreamCommitCreatedDocument,
  OnUserStreamRemovedDocument,
  UserProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext, getMainTestRegionKey } from '@/test/hooks'
import { BasicTestCommit, createTestCommits } from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

const saveActivity = saveActivityFactory({ db })

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

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
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
    })
  })
})
