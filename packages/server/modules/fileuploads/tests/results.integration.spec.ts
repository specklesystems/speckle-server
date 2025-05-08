/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'

import type { Server } from 'http'
import type { Express } from 'express'
import request from 'supertest'
import { Scopes } from '@/modules/core/helpers/mainConstants'
import {
  createStreamFactory,
  getStreamFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
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
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { sendEmail } from '@/modules/emails/services/sending'
import { createTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
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
import cryptoRandomString from 'crypto-random-string'
import {
  createRandomEmail,
  createRandomPassword,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { noErrors } from '@/test/helpers'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { randomInt } from 'crypto'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

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
const createToken = createTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  })
})
const saveUploadFile = saveUploadFileFactory({
  db
})

const createFileUploadJob = (params: { projectId: string; userId: string }) => {
  const { projectId, userId } = params
  const jobId = cryptoRandomString({ length: 10 })
  const data = {
    fileId: jobId,
    streamId: projectId,
    branchName: cryptoRandomString({ length: 10 }),
    userId,
    fileName: cryptoRandomString({ length: 10 }),
    fileType: cryptoRandomString({ length: 3 }),
    fileSize: randomInt(1, 1e6)
  }
  return saveUploadFile(data)
}

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = getFeatureFlags()

;(FF_NEXT_GEN_FILE_IMPORTER_ENABLED ? describe : describe.skip)(
  'File import results @fileuploads integration',
  () => {
    let server: Server
    let app: Express
    let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

    const userOne = {
      name: createRandomString(),
      email: createRandomEmail(),
      password: createRandomPassword()
    }

    let userOneId: string
    let userOneToken: string
    let projectOneId: string
    let jobOneId: string
    let existingCanonicalUrl: string
    let existingPort: string
    let serverAddress: string
    let serverPort: string

    before(async () => {
      const ctx = await beforeEachContext()
      server = ctx.server
      app = ctx.app
      ;({ serverAddress, serverPort, sendRequest } = await initializeTestServer(ctx))

      //TODO does mocha have a nicer way of temporarily swapping an environment variable, like vitest?
      existingCanonicalUrl = process.env['CANONICAL_URL'] || ''
      existingPort = process.env['PORT'] || ''
      process.env['CANONICAL_URL'] = serverAddress
      process.env['PORT'] = serverPort

      userOneId = await createUser(userOne)
    })
    beforeEach(async () => {
      projectOneId = await createStream({ ownerId: userOneId })
      ;({ token: userOneToken } = await createToken({
        userId: userOneId,
        name: createRandomString(),
        scopes: [Scopes.Streams.Write]
      }))

      //FIXME currently assuming a 1:1 file to job mapping
      ;({ id: jobOneId } = await createFileUploadJob({
        projectId: projectOneId,
        userId: userOneId
      }))
    })

    afterEach(async () => {
      projectOneId = ''
    })

    after(async () => {
      process.env['CANONICAL_URL'] = existingCanonicalUrl
      process.env['PORT'] = existingPort
      await server?.close()
    })

    const getFileUploads = (projectId: string, token: string) =>
      sendRequest(token, {
        query: `query ($streamId: String!) {
                stream(id: $streamId) {
                  id
                  fileUploads {
                    id
                    fileName
                    convertedStatus
                  }
                }
              }`,
        variables: { streamId: projectId }
      })

    describe('Receive results from file import service', async () => {
      it('should 403 if no auth token is provided', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectOneId}/fileimporter/jobs/${jobOneId}/results`)
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({})) //TODO should be a valid payload

        expect(response.status).to.equal(403)

        const gqlResponse = await getFileUploads(projectOneId, userOneToken)
        expect(noErrors(gqlResponse))
        expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
        expect(gqlResponse.body.data.stream.fileUploads[0].id).to.equal(jobOneId)
        expect(gqlResponse.body.data.stream.fileUploads[0].status).to.equal('PENDING')
      })
      it('should 403 if an invalid auth token is provided', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectOneId}/fileimporter/jobs/:jobId/results`)
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${cryptoRandomString({ length: 20 })}`)
          .send(JSON.stringify({})) //TODO should be a valid payload

        expect(response.status).to.equal(403)
      })
      it('should 403 if the token does not have the correct scopes', async () => {})
      it('should 403 if the token is not for the correct stream', async () => {})
      it('should 400 if the payload is invalid', async () => {})
      it('should 400 if the job id cannot be found', async () => {})
      it('should 200 if the job id is found', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectOneId}/fileimporter/jobs/:jobId/results`)
          .set('Authorization', `Bearer ${userOneToken}`)
          .set('Content-Type', 'application/json')
          .send(JSON.stringify({})) //TODO should be a valid payload

        expect(response.status).to.equal(200)
      })
    })
  }
)
