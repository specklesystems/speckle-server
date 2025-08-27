/* istanbul ignore file */
import { expect } from 'chai'
import assert from 'assert'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { noErrors } from '@/test/helpers'
import { Scopes, Roles, ensureError } from '@speckle/shared'
import {
  createWebhookConfigFactory,
  countWebhooksByStreamIdFactory,
  getWebhookByIdFactory,
  updateWebhookConfigFactory,
  deleteWebhookConfigFactory,
  getStreamWebhooksFactory,
  createWebhookEventFactory,
  getLastWebhookEventsFactory
} from '@/modules/webhooks/repositories/webhooks'
import { db } from '@/db/knex'
import {
  createWebhookFactory,
  updateWebhookFactory,
  deleteWebhookFactory,
  dispatchStreamEventFactory
} from '@/modules/webhooks/services/webhooks'
import {
  getStreamFactory,
  createStreamFactory,
  grantStreamPermissionsFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
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
  getUserFactory,
  getUsersFactory,
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
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory
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
import { omit } from 'lodash-es'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const updateWebhook = updateWebhookFactory({
  updateWebhookConfig: updateWebhookConfigFactory({ db })
})
const getStreamWebhooks = getStreamWebhooksFactory({ db })

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
    storeProjectRole: storeProjectRoleFactory({ db }),
    emitEvent: getEventBus().emit
  })
})
const grantPermissionsStream = grantStreamPermissionsFactory({ db })
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
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

describe('Webhooks @webhooks', () => {
  const getWebhook = getWebhookByIdFactory({ db })
  let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

  const userOne = {
    name: 'User',
    email: 'user@example.org',
    password: 'jdsadjsadasfdsa',
    id: '',
    token: ''
  }

  const streamOne = {
    name: 'streamOne',
    description: 'stream',
    isPublic: true,
    ownerId: '',
    id: ''
  }

  const webhookOne = {
    streamId: '', // filled in `before`
    url: 'http://localhost:42/non-existent',
    description: 'test wh',
    secret: 'secret',
    enabled: true,
    triggers: ['commit_create', 'commit_update'],
    id: ''
  }

  before(async () => {
    const ctx = await beforeEachContext()
    ;({ sendRequest } = await initializeTestServer(ctx))

    userOne.id = await createUser(userOne)
    streamOne.ownerId = userOne.id
    streamOne.id = await createStream(streamOne)

    webhookOne.streamId = streamOne.id
  })

  describe('Create, Read, Update, Delete Webhooks', () => {
    it('Should create a webhook', async () => {
      webhookOne.id = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhookOne)
      expect(webhookOne).to.have.property('id')
      expect(webhookOne.id).to.not.be.null
    })

    it('Should get a webhook', async () => {
      const webhook = await getWebhook({ id: webhookOne.id })
      expect(webhook).to.not.be.null
      expect(webhook).to.have.property('url')
      expect(webhook!.url).to.equal(webhookOne.url)
    })

    it('Should update a webhook', async () => {
      const webhookId = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhookOne)

      const newUrl = 'http://localhost:42/new-url'
      await updateWebhook({ id: webhookId, url: newUrl })
      const webhook = await getWebhook({ id: webhookId })
      expect(webhook).to.not.be.null
      expect(webhook).to.have.property('url')
      expect(webhook!.url).to.equal(newUrl)
    })

    it('Should delete a webhook', async () => {
      const stream = {
        name: 'test stream',
        description: 'stream',
        isPublic: true,
        ownerId: userOne.id
      }
      const streamId = await createStream(stream)
      const webhook = {
        streamId,
        url: 'http://localhost:42/non-existent',
        description: 'test wh',
        secret: 'secret',
        enabled: true,
        triggers: ['commit_create', 'commit_update'],
        id: ''
      }
      webhook.id = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhook)
      await deleteWebhookFactory({
        deleteWebhookConfig: deleteWebhookConfigFactory({ db }),
        getWebhookById: getWebhookByIdFactory({ db })
      })(webhook)
      const webhookDeleted = await getWebhookByIdFactory({ db })({ id: webhook.id })
      expect(webhookDeleted).to.be.null
    })

    it('Should get webhooks for stream', async () => {
      const stream = {
        name: 'streamOne',
        description: 'stream',
        isPublic: true,
        ownerId: userOne.id
      }
      const streamId = await createStream(stream)
      let streamWebhooks = await getStreamWebhooks({ streamId })
      expect(streamWebhooks).to.have.lengthOf(0)

      const webhook = {
        streamId, // filled in `before`
        url: 'http://localhost:42/non-existent',
        description: 'test wh',
        secret: 'secret',
        enabled: true,
        triggers: ['commit_create', 'commit_update']
      }
      await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhook)
      streamWebhooks = await getStreamWebhooks({ streamId })
      expect(streamWebhooks).to.have.lengthOf(1)
      expect(streamWebhooks[0]).to.have.property('url')
      expect(streamWebhooks[0].url).to.equal(webhook.url)
    })

    it('Should dispatch and get events', async () => {
      const stream = {
        name: 'streamOne',
        description: 'stream',
        isPublic: true,
        ownerId: userOne.id
      }
      const streamId = await createStream(stream)
      const streamWebhooks = await getStreamWebhooks({ streamId })
      expect(streamWebhooks).to.have.lengthOf(0)

      const webhook = {
        streamId, // filled in `before`
        url: 'http://localhost:42/non-existent',
        description: 'test wh',
        secret: 'secret',
        enabled: true,
        triggers: ['commit_create', 'commit_update']
      }
      const webhookId = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhook)
      await dispatchStreamEventFactory({
        getServerInfo,
        getStream,
        createWebhookEvent: createWebhookEventFactory({ db }),
        getStreamWebhooks: getStreamWebhooksFactory({ db }),
        getUser
      })({
        streamId,
        event: 'commit_create',
        eventPayload: { test: 'payload123' }
      })
      const lastEvents = await getLastWebhookEventsFactory({ db })({ webhookId })
      expect(lastEvents).to.have.lengthOf(1)
      expect(JSON.parse(lastEvents[0].payload).test).to.equal('payload123')
    })
  })

  describe('GraphQL API Webhooks @webhooks-api', () => {
    const userTwo = {
      name: 'User2',
      email: 'user2@example.org',
      password: 'jdsadjsadasfdsa',
      id: '',
      token: ''
    }

    const webhookTwo = {
      streamId: '',
      url: 'http://localhost:42/non-existent-two',
      description: 'test wh no 2',
      secret: 'secret',
      enabled: true,
      triggers: ['commit_create', 'commit_update'],
      id: ''
    }

    const streamTwo = {
      name: 'streamTwo',
      description: 'stream',
      isPublic: true,
      ownerId: '',
      id: ''
    }

    before(async () => {
      userTwo.id = await createUser(userTwo)
      streamTwo.ownerId = userTwo.id
      streamTwo.id = await createStream(streamTwo)
      webhookTwo.streamId = streamTwo.id

      userOne.token = `Bearer ${await createPersonalAccessToken(
        userOne.id,
        'userOne test token',
        [Scopes.Streams.Read, Scopes.Streams.Write]
      )}`
      userTwo.token = `Bearer ${await createPersonalAccessToken(
        userTwo.id,
        'userTwo test token',
        [Scopes.Streams.Read, Scopes.Streams.Write]
      )}`
      await grantPermissionsStream({
        streamId: streamTwo.id,
        userId: userOne.id,
        role: Roles.Stream.Contributor
      })
    })

    it('Should create a webhook', async () => {
      const res = await sendRequest(userTwo.token, {
        query:
          'mutation createWebhook($webhook: WebhookCreateInput!) { webhookCreate( webhook: $webhook ) }',
        variables: { webhook: omit(webhookTwo, ['id']) }
      })
      expect(noErrors(res))
      expect(res.body.data.webhookCreate).to.not.be.null
      webhookTwo.id = res.body.data.webhookCreate
    })

    it('Should get stream webhooks and the previous events', async () => {
      await dispatchStreamEventFactory({
        getServerInfo,
        getStream,
        getStreamWebhooks: getStreamWebhooksFactory({ db }),
        createWebhookEvent: createWebhookEventFactory({ db }),
        getUser
      })({
        streamId: streamTwo.id,
        event: 'commit_create',
        eventPayload: { test: 'payload321' }
      })
      const res = await sendRequest(userTwo.token, {
        query: `query {
        stream(id: "${streamTwo.id}") {
          webhooks { totalCount items { id url enabled
            history { totalCount items { status statusInfo payload } } }
          }
        }
      }`
      })
      expect(noErrors(res))
      const webhooks = res.body.data.stream.webhooks

      expect(webhooks.totalCount).to.equal(1)
      expect(webhooks.items[0].url).to.equal(webhookTwo.url)
      expect(webhooks.items[0].history.totalCount).to.equal(1)
      expect(JSON.parse(webhooks.items[0].history.items[0].payload).test).to.equal(
        'payload321'
      )
    })

    it('Should update a webhook', async () => {
      const res = await sendRequest(userTwo.token, {
        query: `mutation { webhookUpdate(webhook: { id: "${webhookTwo.id}", streamId: "${streamTwo.id}", description: "updated webhook", enabled: false })
    }`
      })
      const webhook = await getWebhook({ id: webhookTwo.id })
      expect(noErrors(res))
      expect(res.body.data.webhookUpdate).to.equal(webhook!.id)
      expect(webhook!.description).to.equal('updated webhook')
      expect(webhook!.enabled).to.equal(false)
    })

    it('Should *not* update or delete a webhook if the stream id and webhook id do not match', async () => {
      const res1 = await sendRequest(userOne.token, {
        query: `mutation { webhookDelete(webhook: { id: "${webhookTwo.id}", streamId: "${streamOne.id}" } ) }`
      })
      expect(res1.body.errors).to.exist
      expect(res1.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res1.body.errors[0].message).to.equal(
        'The webhook id and stream id do not match. Please check your inputs.'
      )
      expect(res1.body.errors[0].extensions.code).to.equal('FORBIDDEN')

      const res2 = await sendRequest(userOne.token, {
        query: `mutation { webhookUpdate(webhook: { id: "${webhookTwo.id}", streamId: "${streamOne.id}", description: "updated webhook", enabled: false }) }`
      })
      expect(res2.body.errors).to.exist
      expect(res2.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res2.body.errors[0].message).to.equal(
        'The webhook id and stream id do not match. Please check your inputs.'
      )
      expect(res2.body.errors[0].extensions.code).to.equal('FORBIDDEN')
    })

    it('Should delete a webhook', async () => {
      const stream = {
        name: 'test stream',
        description: 'stream',
        isPublic: true,
        ownerId: userOne.id
      }
      const streamId = await createStream(stream)
      const webhook = {
        streamId,
        url: 'http://localhost:42/non-existent',
        description: 'test wh',
        secret: 'secret',
        enabled: true,
        triggers: ['commit_create', 'commit_update'],
        id: ''
      }
      webhook.id = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })(webhook)
      const res = await sendRequest(userOne.token, {
        query: `mutation { webhookDelete(webhook: { id: "${webhook.id}", streamId: "${streamId}" } ) }`
      })
      expect(noErrors(res))
      expect(res.body.data.webhookDelete).to.equal(webhook.id)
    })

    it('Should *not* create a webhook if user is not a stream owner', async () => {
      webhookTwo.id = ''
      const res = await sendRequest(userOne.token, {
        query:
          'mutation createWebhook($webhook: WebhookCreateInput!) { webhookCreate( webhook: $webhook ) }',
        variables: { webhook: omit(webhookTwo, ['id']) }
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
    })

    it('Should *not* get a webhook if the user is not a stream owner', async () => {
      const res = await sendRequest(userOne.token, {
        query: `query {
        stream(id: "${streamTwo.id}") { webhooks { totalCount items { id url enabled } } }
      }`
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
    })

    it('Should have a webhook limit for streams', async () => {
      const limit = 100
      const stream = {
        name: 'test stream',
        description: 'stream',
        isPublic: true,
        ownerId: userOne.id
      }
      const streamId = await createStream(stream)
      const webhook = {
        streamId,
        url: 'http://localhost:42/non-existent',
        description: 'test wh',
        secret: 'secret',
        enabled: true,
        triggers: ['commit_create', 'commit_update']
      }
      for (let i = 0; i < limit; i++) {
        await createWebhookFactory({
          createWebhookConfig: createWebhookConfigFactory({ db }),
          countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
        })(webhook)
      }

      try {
        await createWebhookFactory({
          createWebhookConfig: createWebhookConfigFactory({ db }),
          countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
        })(webhook)
      } catch (err) {
        if (ensureError(err).toString().indexOf('Maximum') > -1) return
      }

      assert.fail('Configured more webhooks than the limit')
    })
  })
})
