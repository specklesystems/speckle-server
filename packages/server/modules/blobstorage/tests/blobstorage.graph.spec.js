const { buildApolloServer } = require('@/app')
const { truncateTables } = require('@/test/hooks')
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
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
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
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
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
      context: await createAuthedTestContext(user.id)
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
