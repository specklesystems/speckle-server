/* istanbul ignore file */
const expect = require('chai').expect
const assert = require('assert')

const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { noErrors } = require('@/test/helpers')
const { createPersonalAccessToken } = require('../../core/services/tokens')
const {
  createWebhook,
  getStreamWebhooks,
  getLastWebhookEvents,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  dispatchStreamEvent
} = require('../services/webhooks')
const { createUser } = require('../../core/services/users')
const { createStream, grantPermissionsStream } = require('../../core/services/streams')

describe('Webhooks @webhooks', () => {
  let server, sendRequest

  const userOne = {
    name: 'User',
    email: 'user@gmail.com',
    password: 'jdsadjsadasfdsa'
  }

  const streamOne = {
    name: 'streamOne',
    description: 'stream',
    isPublic: true
  }

  const webhookOne = {
    streamId: null, // filled in `before`
    url: 'http://localhost:42/non-existent',
    description: 'test wh',
    secret: 'secret',
    enabled: true,
    triggers: ['commit_create', 'commit_update']
  }

  before(async () => {
    const { app } = await beforeEachContext()
    ;({ server, sendRequest } = await initializeTestServer(app))

    userOne.id = await createUser(userOne)
    streamOne.ownerId = userOne.id
    streamOne.id = await createStream(streamOne)

    webhookOne.streamId = streamOne.id
  })

  after(async () => {
    await server.close()
  })

  describe('Create, Read, Update, Delete Webhooks', () => {
    it('Should create a webhook', async () => {
      webhookOne.id = await createWebhook(webhookOne)
      expect(webhookOne).to.have.property('id')
      expect(webhookOne.id).to.not.be.null
    })

    it('Should get a webhook', async () => {
      const webhook = await getWebhook({ id: webhookOne.id })
      expect(webhook).to.not.be.null
      expect(webhook).to.have.property('url')
      expect(webhook.url).to.equal(webhookOne.url)
    })

    it('Should update a webhook', async () => {
      const newUrl = 'http://localhost:42/new-url'
      await updateWebhook({ id: webhookOne.id, url: newUrl })
      const webhook = await getWebhook({ id: webhookOne.id })
      expect(webhook).to.not.be.null
      expect(webhook).to.have.property('url')
      expect(webhook.url).to.equal(newUrl)
    })

    it('Should delete a webhook', async () => {
      await deleteWebhook({ id: webhookOne.id })
      const webhook = await getWebhook({ id: webhookOne.id })
      expect(webhook).to.be.undefined
    })

    it('Should get webhooks for stream', async () => {
      let streamWebhooks = await getStreamWebhooks({ streamId: streamOne.id })
      expect(streamWebhooks).to.have.lengthOf(0)

      webhookOne.id = await createWebhook(webhookOne)
      streamWebhooks = await getStreamWebhooks({ streamId: streamOne.id })
      expect(streamWebhooks).to.have.lengthOf(1)
      expect(streamWebhooks[0]).to.have.property('url')
      expect(streamWebhooks[0].url).to.equal(webhookOne.url)
    })

    it('Should dispatch and get events', async () => {
      await dispatchStreamEvent({
        streamId: streamOne.id,
        event: 'commit_create',
        eventPayload: { test: 'payload123' }
      })
      const lastEvents = await getLastWebhookEvents({ webhookId: webhookOne.id })
      expect(lastEvents).to.have.lengthOf(1)
      expect(JSON.parse(lastEvents[0].payload).test).to.equal('payload123')
    })
  })

  describe('GraphQL API Webhooks @webhooks-api', () => {
    const userTwo = {
      name: 'User2',
      email: 'user2@gmail.com',
      password: 'jdsadjsadasfdsa'
    }

    const webhookTwo = {
      streamId: null,
      url: 'http://localhost:42/non-existent-two',
      description: 'test wh no 2',
      secret: 'secret',
      enabled: true,
      triggers: ['commit_create', 'commit_update']
    }

    const streamTwo = {
      name: 'streamTwo',
      description: 'stream',
      isPublic: true
    }

    before(async () => {
      userTwo.id = await createUser(userTwo)
      streamTwo.ownerId = userTwo.id
      streamTwo.id = await createStream(streamTwo)
      webhookTwo.streamId = streamTwo.id

      userOne.token = `Bearer ${await createPersonalAccessToken(
        userOne.id,
        'userOne test token',
        ['streams:read', 'streams:write']
      )}`
      userTwo.token = `Bearer ${await createPersonalAccessToken(
        userTwo.id,
        'userTwo test token',
        ['streams:read', 'streams:write']
      )}`
      await grantPermissionsStream({
        streamId: streamTwo.id,
        userId: userOne.id,
        role: 'stream:contributor'
      })
    })

    it('Should create a webhook', async () => {
      const res = await sendRequest(userTwo.token, {
        query:
          'mutation createWebhook($webhook: WebhookCreateInput!) { webhookCreate( webhook: $webhook ) }',
        variables: { webhook: webhookTwo }
      })
      expect(noErrors(res))
      expect(res.body.data.webhookCreate).to.not.be.null
      webhookTwo.id = res.body.data.webhookCreate
    })

    it('Should get stream webhooks and the previous events', async () => {
      await dispatchStreamEvent({
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
      expect(res.body.data.webhookUpdate).to.equal('true')
      expect(webhook.description).to.equal('updated webhook')
      expect(webhook.enabled).to.equal(false)
    })

    it('Should *not* update or delete a webhook if the stream id and webhook id do not match', async () => {
      const res1 = await sendRequest(userOne.token, {
        query: `mutation { webhookDelete(webhook: { id: "${webhookTwo.id}", streamId: "${streamOne.id}" } ) }`
      })
      expect(res1.body.errors).to.exist
      expect(res1.body.errors[0].message).to.equal(
        'The webhook id and stream id do not match. Please check your inputs.'
      )
      expect(res1.body.errors[0].extensions.code).to.equal('FORBIDDEN')

      const res2 = await sendRequest(userOne.token, {
        query: `mutation { webhookUpdate(webhook: { id: "${webhookTwo.id}", streamId: "${streamOne.id}", description: "updated webhook", enabled: false }) }`
      })
      expect(res2.body.errors).to.exist
      expect(res2.body.errors[0].message).to.equal(
        'The webhook id and stream id do not match. Please check your inputs.'
      )
      expect(res2.body.errors[0].extensions.code).to.equal('FORBIDDEN')
    })

    it('Should delete a webhook', async () => {
      const res = await sendRequest(userTwo.token, {
        query: `mutation { webhookDelete(webhook: { id: "${webhookTwo.id}", streamId: "${streamTwo.id}" } ) }`
      })
      expect(noErrors(res))
      expect(res.body.data.webhookDelete).to.equal('true')
    })

    it('Should *not* create a webhook if user is not a stream owner', async () => {
      delete webhookTwo.id
      const res = await sendRequest(userOne.token, {
        query:
          'mutation createWebhook($webhook: WebhookCreateInput!) { webhookCreate( webhook: $webhook ) }',
        variables: { webhook: webhookTwo }
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
      for (let i = 0; i < limit - 1; i++) {
        await createWebhook(webhookOne)
      }

      try {
        await createWebhook(webhookOne)
      } catch (err) {
        if (err.toString().indexOf('Maximum') > -1) return
      }

      assert.fail('Configured more webhooks than the limit')
    })

    it('Should cleanup stream webhooks', async () => {
      // just cleanup the 99 extra webhooks added before (not a real test)
      let streamWebhooks = await getStreamWebhooks({ streamId: streamOne.id })
      for (const webhook of streamWebhooks) {
        if (webhook.id !== webhookOne.id) {
          await deleteWebhook({ id: webhook.id })
        }
      }

      streamWebhooks = await getStreamWebhooks({ streamId: streamOne.id })
      expect(streamWebhooks).to.have.lengthOf(1)
      expect(streamWebhooks[0]).to.have.property('id')
      expect(streamWebhooks[0].id).to.equal(webhookOne.id)
    })
  })
})
