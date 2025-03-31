import cryptoRandomString from 'crypto-random-string'
import {
  createStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteServerOnlyInvitesFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  createBranchFactory,
  getStreamBranchByNameFactory
} from '@/modules/core/repositories/branches'
import {
  countAdminUsersFactory,
  getUserFactory,
  getUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { sendEmail } from '@/modules/emails/services/sending'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { manageFileImportExpiryFactory } from '@/modules/fileuploads/services/tasks'
import {
  getAllPendingUploadsFactory,
  getFileInfoFactory,
  saveUploadFileFactory,
  updateUploadFileFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import {
  insertNewUploadAndNotifyFactory,
  updateUploadAndNotifyFactory
} from '@/modules/fileuploads/services/management'
import { publish } from '@/modules/shared/utils/subscriptions'
import { testLogger as logger } from '@/observability/logging'
import { sleep } from '@/test/helpers'
import { expect } from 'chai'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { TIME } from '@speckle/shared'

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

const garbageCollector = manageFileImportExpiryFactory({
  getPendingUploads: getAllPendingUploadsFactory({ db }),
  updateUploadStatus: updateUploadAndNotifyFactory({
    getStreamBranchByName: getStreamBranchByNameFactory({ db }),
    updateUploadFile: updateUploadFileFactory({ db }),
    publish
  })
})

describe('FileUploads @fileuploads', () => {
  const userOne = {
    name: cryptoRandomString({ length: 10 }),
    email: `${cryptoRandomString({ length: 10 })}@example.org`,
    password: cryptoRandomString({ length: 10 })
  }

  let userOneId: string
  let createdStreamId: string

  before(async () => {
    userOneId = await createUser(userOne)
  })

  beforeEach(async () => {
    createdStreamId = await createStream({ ownerId: userOneId })
  })
  afterEach(async () => {
    createdStreamId = ''
  })
  describe('Convert files', () => {
    it('Should garbage collect expired files', async () => {
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db }),
        saveUploadFile: saveUploadFileFactory({ db }),
        publish
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        streamId: createdStreamId,
        branchName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain'
      })
      await sleep(2000)
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 })
      const results = await getFileInfoFactory({ db })({ fileId })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Error)
    })
    it('Should not garbage collect files that are not expired', async () => {
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db }),
        saveUploadFile: saveUploadFileFactory({ db }),
        publish
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        streamId: createdStreamId,
        branchName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain'
      })
      // timeout far in the future, so it won't be garbage collected
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 * TIME.hour })
      const results = await getFileInfoFactory({ db })({ fileId })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Queued)
    })
  })
})
