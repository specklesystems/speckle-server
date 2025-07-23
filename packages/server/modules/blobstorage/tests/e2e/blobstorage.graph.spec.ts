import { buildApolloServer } from '@/app'
import { truncateTables } from '@/test/hooks'
import gql from 'graphql-tag'
import { createBlobs } from '@/modules/blobstorage/tests/helpers'
import { expect } from 'chai'
import { Users, Streams } from '@/modules/core/dbSchema'
import type { ServerAndContext } from '@/test/graphqlHelper'
import { createAuthedTestContext, executeOperation } from '@/test/graphqlHelper'
import {
  getStreamFactory,
  createStreamFactory,
  grantStreamPermissionsFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findInviteFactory,
  deleteInvitesByTargetFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

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
        getServerInfo,
        finalizeInvite: buildFinalizeProjectInvite()
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    emitEvent: getEventBus().emit
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
  emitEvent: getEventBus().emit
})

describe('Blobs graphql @blobstorage', () => {
  let graphqlServer: ServerAndContext

  const user = {
    name: 'Baron Von Blubba',
    email: 'zebarron@bubble.bobble',
    password: 'bubblesAreMyBlobs',
    id: ''
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

    const blobMetadata = result.data!.stream.blob
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
    expect(result.data!.stream.blobs.totalCount).to.equal(number)
    expect(result.data!.stream.blobs.totalSize).to.equal(number * fileSize)
  })
})
