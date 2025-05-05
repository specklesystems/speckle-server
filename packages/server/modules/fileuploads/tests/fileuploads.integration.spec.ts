/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'

import type { Server } from 'http'
import type { Express } from 'express'
import request from 'supertest'
import { Scopes } from '@/modules/core/helpers/mainConstants'
import cryptoRandomString from 'crypto-random-string'
import { noErrors } from '@/test/helpers'
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
import { TIME_MS } from '@speckle/shared'
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

describe('FileUploads @fileuploads integration', () => {
  let server: Server
  let app: Express

  const userOne = {
    name: 'User',
    email: 'user@example.org',
    password: 'jdsadjsadasfdsa'
  }

  let userOneId: string
  let userOneToken: string
  let createdStreamId: string
  let existingCanonicalUrl: string
  let existingPort: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sendRequest: (token: string, query: string | object) => Promise<any>
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
    createdStreamId = await createStream({ ownerId: userOneId })
    ;({ token: userOneToken } = await createToken({
      userId: userOneId,
      name: 'test token',
      scopes: [Scopes.Streams.Write]
    }))
  })

  afterEach(async () => {
    createdStreamId = ''
  })

  after(async () => {
    process.env['CANONICAL_URL'] = existingCanonicalUrl
    process.env['PORT'] = existingPort
    await server?.close()
  })

  describe('Uploads files', () => {
    it('Should upload a single file', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.statusCode).to.equal(201)
      expect(response.headers['content-type']).to.contain('application/json;')
      expect(response.body.uploadResults).to.have.lengthOf(1)
      expect(response.body.uploadResults[0].fileName).to.equal('test.ifc')
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
      expect(gqlResponse.body.data.stream.fileUploads[0].fileName).to.equal('test.ifc')
      expect(gqlResponse.body.data.stream.fileUploads[0].id).to.equal(
        response.body.uploadResults[0].blobId
      )

      //TODO expect subscription notification
    })

    it('Uploads from multipart upload', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('blob1', require.resolve('@/readme.md'), 'test1.ifc')
        .attach('blob2', require.resolve('@/package.json'), 'test2.ifc')
      expect(response.status).to.equal(201)
      expect(response.headers['content-type']).to.contain('application/json;')
      expect(response.body.uploadResults).to.have.lengthOf(2)
      expect(
        response.body.uploadResults.map((file: { fileName: string }) => file.fileName)
      ).to.have.members(['test1.ifc', 'test2.ifc'])
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(2)
      expect(
        gqlResponse.body.data.stream.fileUploads.map(
          (file: { fileName: string }) => file.fileName
        )
      ).to.have.members(['test1.ifc', 'test2.ifc'])
      expect(
        gqlResponse.body.data.stream.fileUploads.map((file: { id: string }) => file.id)
      ).to.have.members(
        response.body.uploadResults.map((file: { blobId: string }) => file.blobId)
      )
    })

    it('Returns 400 for bad form data', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data; boundary=XXX')
        // sending an unfinished part
        .send('--XXX\r\nCon')

      expect(response.status).to.equal(400)
      expect(response.headers['content-type']).to.contain('application/json;')
      expect(response.body.error).to.contain('Upload request error.')
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(0)
    })

    it('Returns 400 for missing headers', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
      // .set('Content-type', 'multipart/form-data; boundary=XXX') // purposely missing content type

      expect(response.status).to.equal(400)
      expect(response.headers['content-type']).to.contain('application/json;')
      expect(response.body.error.message).to.contain('Missing Content-Type')
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(0)
    })

    it('Returns OK but describes errors for too big files', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('toolarge.ifc', Buffer.alloc(114_857_601, 'asdf'), 'toolarge.ifc')
      expect(response.status).to.equal(201)
      expect(response.headers['content-type']).to.contain('application/json;')
      expect(response.body.uploadResults).to.have.lengthOf(1)
      expect(
        response.body.uploadResults.map((file: { fileName: string }) => file.fileName)
      ).to.have.members(['toolarge.ifc'])
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(1)
      expect(gqlResponse.body.data.stream.fileUploads[0].id).to.equal(
        response.body.uploadResults[0].blobId
      )
      //TODO expect no notifications
    })

    //TODO test for bad token
    it('Returns 403 for token without stream write permissions', async () => {
      const { token: badToken } = await createToken({
        userId: userOneId,
        name: 'test token',
        scopes: [Scopes.Streams.Read],
        lifespan: TIME_MS.hour
      })
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${badToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')
      expect(response.statusCode).to.equal(403)
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(0)
      //TODO expect no notifications
    })

    it('Should not upload a file to a non-existent stream', async () => {
      const badStreamId = cryptoRandomString({ length: 10 })
      const response = await request(app)
        .post(`/api/file/autodetect/${badStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')
      expect(response.statusCode).to.equal(404) //FIXME should be 404 (technically a 401, but we don't want to leak existence of stream so 404 is preferrable)
      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(0)
      //TODO expect no subscription notifications
    })

    it('Should not upload a file to a stream you do not have access to', async () => {
      const userTwo = {
        name: 'User Two',
        email: 'user2@example.org',
        password: 'jdsadjsadasfdsa'
      }
      const userTwoId = await createUser(userTwo)
      const streamTwoId = await createStream({ ownerId: userTwoId })

      const response = await request(app)
        .post(`/api/file/autodetect/${streamTwoId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.statusCode).to.equal(403)
      expect(response.body).to.deep.equal({
        error: 'You do not have access to the project'
      })

      const gqlResponse = await sendRequest(userOneToken, {
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
        variables: { streamId: createdStreamId }
      })
      expect(noErrors(gqlResponse))
      expect(
        gqlResponse.body.data.stream.fileUploads,
        JSON.stringify(gqlResponse.body.data)
      ).to.have.lengthOf(0)
      //TODO expect no subscription notifications
    })
  })
})
