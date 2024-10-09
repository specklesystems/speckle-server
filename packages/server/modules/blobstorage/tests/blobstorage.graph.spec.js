const { buildApolloServer } = require('@/app')
const { truncateTables } = require('@/test/hooks')
const { createUser } = require('@/modules/core/services/users')
const { gql } = require('graphql-tag')
const { createBlobs } = require('@/modules/blobstorage/tests/helpers')
const { expect } = require('chai')
const { Users, Streams } = require('@/modules/core/dbSchema')
const { createAuthedTestContext, executeOperation } = require('@/test/graphqlHelper')
const {
  getStreamFactory,
  createStreamFactory
} = require('@/modules/core/repositories/streams')
const { db } = require('@/db/knex')
const {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} = require('@/modules/core/services/streams/management')
const {
  inviteUsersToProjectFactory
} = require('@/modules/serverinvites/services/projectInviteManagement')
const {
  createAndSendInviteFactory
} = require('@/modules/serverinvites/services/creation')
const {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { getUsers } = require('@/modules/core/repositories/users')
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  addStreamCreatedActivityFactory
} = require('@/modules/activitystream/services/streamActivity')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')

const addStreamCreatedActivity = addStreamCreatedActivityFactory({
  saveActivity: saveActivityFactory({ db }),
  publish
})
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory(),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          })
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

describe('Blobs graphql @blobstorage', () => {
  /** @type {import('@/test/graphqlHelper').ServerAndContext} */
  let graphqlServer

  const user = {
    name: 'Baron Von Blubba',
    email: 'zebarron@bubble.bobble',
    password: 'bubblesAreMyBlobs'
  }
  before(async () => {
    await truncateTables(['blob_storage', Users.name, Streams.name])
    user.id = await createUser(user)
    graphqlServer = {
      apollo: await buildApolloServer(),
      context: createAuthedTestContext(user.id)
    }
  })

  it('Stream has blob metadata for a single blob', async () => {
    const query = gql`
      query ($streamId: String!, $blobId: String!) {
        stream(id: $streamId) {
          id
          blob(id: $blobId) {
            id
            fileName
            uploadStatus
            fileSize
            fileHash
          }
        }
      }
    `
    const streamId = await createStream({ ownerId: user.id })
    const [blob] = await createBlobs({ streamId, number: 1 })

    const result = await executeOperation(graphqlServer, query, {
      streamId,
      blobId: blob.id
    })

    const blobMetadata = result.data.stream.blob
    expect(blobMetadata.id).to.equal(blob.id)
    expect(blobMetadata.fileSize).to.equal(blob.fileSize)
    expect(blobMetadata.fileHash).to.equal(blob.fileHash)
  })

  it('Blob metadata collection returns proper summary values', async () => {
    const query = gql`
      query ($streamId: String!) {
        stream(id: $streamId) {
          id
          blobs {
            totalCount
            totalSize
          }
        }
      }
    `
    const streamId = await createStream({ ownerId: user.id })
    const number = 10
    const fileSize = 123
    await createBlobs({ streamId, number, fileSize })
    const result = await executeOperation(graphqlServer, query, { streamId })
    expect(result.data.stream.blobs.totalCount).to.equal(number)
    expect(result.data.stream.blobs.totalSize).to.equal(number * fileSize)
  })
})
