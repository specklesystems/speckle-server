/* eslint-disable no-undef */
/* istanbul ignore file */
const expect = require('chai').expect
const request = require('supertest')
const gql = require('graphql-tag')
const { execute } = require('apollo-link')
const { WebSocketLink } = require('apollo-link-ws')
const { SubscriptionClient } = require('subscriptions-transport-ws')
const ws = require('ws')

const { createUser } = require('../services/users')
const { createPersonalAccessToken } = require('../services/tokens')
const { beforeEachContext } = require(`@/test/hooks`)

const { sleep, noErrors } = require('@/test/helpers')
const { appRoot } = require('@/bootstrap')

let addr
let wsAddr
let childPort = null

describe('GraphQL API Subscriptions @gql-subscriptions', () => {
  const userA = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    password: 'wow8charsplease'
  }
  const userB = {
    name: 'd2',
    email: 'd.2@speckle.systems',
    password: 'wow8charsplease'
  }
  const userC = {
    name: 'd3',
    email: 'd.3@speckle.systems',
    password: 'wow8charsplease'
  }
  let serverProcess

  const getWsClient = (wsurl, authToken) => {
    const client = new SubscriptionClient(
      wsAddr,
      {
        reconnect: true,
        connectionParams: { headers: { Authorization: authToken } }
      },
      ws
    )
    return client
  }

  const createSubscriptionObservable = (wsurl, authToken, query, variables) => {
    authToken = authToken || userA.token
    const link = new WebSocketLink(getWsClient(wsurl, authToken))
    return execute(link, { query, variables })
  }

  // set up app & two basic users to ping pong permissions around
  before(async function () {
    this.timeout(15000) // we need to wait for the server to start in the child process!

    await beforeEachContext()

    const childProcess = require('child_process')
    console.log('  Starting server... this might take a bit.')
    serverProcess = childProcess.spawn(
      /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
      ['run', 'dev:server:test'],
      { cwd: appRoot.path }
    )

    const reg = /running at 0.0.0.0:([0-9]*)/
    serverProcess.stderr.on('data', (data) => {
      // uncomment this line to understand a bit more what's happening...
      // console.error( `stderr: ${data}` )
      // ok this is going to be a dirt hack, but I have no better idea ATM
      const match = `${data}`.match(reg)

      if (!childPort && match) {
        childPort = parseInt(match[1])
      }
    })

    // lets wait for the server is starting up
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (childPort) {
        console.log(`Child server started at PORT ${childPort} `)
        addr = `http://localhost:${childPort}/graphql`
        wsAddr = `ws://localhost:${childPort}/graphql`
        break
      }
      await sleep(1000)
    }

    userA.id = await createUser(userA)
    const token = await createPersonalAccessToken(userA.id, 'test token user A', [
      'streams:read',
      'streams:write',
      'users:read',
      'users:email',
      'tokens:write',
      'tokens:read',
      'profile:read',
      'profile:email'
    ])
    userA.token = `Bearer ${token}`

    userB.id = await createUser(userB)
    userB.token = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
      [
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`

    userC.id = await createUser(userC)
    userC.token = `Bearer ${await createPersonalAccessToken(
      userC.id,
      'test token user B',
      ['streams:read', 'streams:write', 'users:read', 'users:email']
    )}`
  })

  after(async () => {
    serverProcess.kill()
  })

  describe('Streams', () => {
    it('A user (me) should be notified when a stream is created', async () => {
      let eventNum = 0
      const query = gql`
        subscription mySub {
          userStreamAdded
        }
      `
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamAdded).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sleep(2500) // we need to wait up a second here
      expect(eventNum).to.equal(2)

      consumer.unsubscribe()
    }).timeout(5000)

    it('A user (me) should be notified when a stream is deleted', async () => {
      const sc1 = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const sc2 = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })

      const sid1 = sc1.body.data.streamCreate
      const sid2 = sc2.body.data.streamCreate

      let eventNum = 0
      const query = gql`
        subscription userStreamRemoved {
          userStreamRemoved
        }
      `
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamRemoved).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { streamDelete(id: "${sid1}" ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sendRequest(userA.token, {
        query: `mutation { streamDelete(id: "${sid2}" ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it('A user (me) should be notified when stream permission is granted', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`
        subscription permissionGranted {
          userStreamAdded
        }
      `
      const client = createSubscriptionObservable(wsAddr, userB.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamAdded).to.exist
        expect(eventData.data.userStreamAdded.sharedBy).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { streamGrantPermission( permissionParams: {streamId: "${streamId}", userId: "${userB.id}", role: "stream:contributor"} ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(1)
      consumer.unsubscribe()
    }).timeout(5000)

    it('A user (me) should be notified when stream permission is revoked', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`
        subscription permissionRevoked {
          userStreamRemoved
        }
      `
      const client = createSubscriptionObservable(wsAddr, userB.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamRemoved).to.exist
        expect(eventData.data.userStreamRemoved.revokedBy).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { streamGrantPermission( permissionParams: {streamId: "${streamId}", userId: "${userB.id}", role: "stream:contributor"} ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { streamRevokePermission( permissionParams: {streamId: "${streamId}", userId: "${userB.id}"} ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(1)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a stream is updated', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`subscription streamUpdated { streamUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.streamUpdated).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream... again!" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sendRequest(userA.token, {
        query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream... again!" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(3)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a stream is deleted', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`subscription streamDeleted { streamDeleted( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.streamDeleted).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { streamDelete( id: "${streamId}" ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(1)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should *not* be notified of stream creation if invalid token', async () => {
      let eventNum = 0
      const query = gql`
        subscription mySub {
          userStreamAdded
        }
      `
      const client = createSubscriptionObservable(wsAddr, 'faketoken123', query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data).to.not.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(0)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should *not* be notified of another user stream created', async () => {
      const query = gql`
        subscription mySub {
          userStreamAdded
        }
      `
      const client = createSubscriptionObservable(wsAddr, userB.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamAdded).to.not.exist
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      consumer.unsubscribe()
    })

    it('Should *not* allow subscribing to stream creation without profile:read scope', async () => {
      let eventNum = 0
      const query = gql`
        subscription mySub {
          userStreamAdded
        }
      `
      const client = createSubscriptionObservable(wsAddr, userC.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.userStreamAdded).to.not.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userC.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sendRequest(userC.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      // unlike with `validateResolver` and `withFilter` within the subscription resolver, this is controlled with a
      // directive which wraps the entire resolver. it seems that in this case the resolver fully executes and does ping
      // the subscriber and increment the eventNum, but ofc does not return a payload if you don't satisfy the directive
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)
  })

  describe('Branches', () => {
    it('Should be notified when a branch is created', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`subscription { branchCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.branchCreated).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "another branch 🥬", description: "this is a test branch 🌳" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a branch is updated', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const bc1 = await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      })
      const branchId = bc1.body.data.branchCreate

      let eventNum = 0
      const query = gql`subscription { branchUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.branchUpdated).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { branchUpdate ( branch: { streamId: "${streamId}", id: "${branchId}", description: "updating this branch" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { branchUpdate ( branch: { streamId: "${streamId}", id: "${branchId}", description: "updating this branch v2" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a branch is deleted', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const bc1 = await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      })
      const bc2 = await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "another branch 🥬", description: "this is a test branch 🌳" } ) }`
      })
      const bid1 = bc1.body.data.branchCreate
      const bid2 = bc2.body.data.branchCreate

      let eventNum = 0
      const query = gql`subscription { branchDeleted( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.branchDeleted).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { branchDelete ( branch: { streamId: "${streamId}", id: "${bid1}" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { branchDelete ( branch: { streamId: "${streamId}", id: "${bid2}" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it("Should *not* be notified when a branch is created for a stream you're not authorised for", async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql`subscription { branchCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userB.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.branchCreated).to.not.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(0)
      consumer.unsubscribe()
    }).timeout(5000)
  })

  describe('Commits', () => {
    it('Should be notified when a commit is created', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const resOC1 = await sendRequest(userA.token, {
        query: `mutation { objectCreate( objectInput: {streamId: "${streamId}", objects: {hello: "goodbye 🌊"}} ) }`
      })
      const resOC2 = await sendRequest(userA.token, {
        query: `mutation { objectCreate( objectInput: {streamId: "${streamId}", objects: {wow: "cool 🐟"}} ) }`
      })
      const objId1 = resOC1.body.data.objectCreate
      const objId2 = resOC2.body.data.objectCreate

      let eventNum = 0
      const query = gql`subscription { commitCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.commitCreated).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "main", objectId: "${objId1}" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "main", objectId: "${objId2}" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a commit is updated', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const resOC = await sendRequest(userA.token, {
        query: `mutation { objectCreate( objectInput: {streamId: "${streamId}", objects: {hello: "goodbye 🌊"}} ) }`
      })
      const objId = resOC.body.data.objectCreate
      const resCC = await sendRequest(userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "main", objectId: "${objId}" } ) }`
      })
      const commitId = resCC.body.data.commitCreate

      let eventNum = 0
      const query = gql`subscription { commitUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.commitUpdated).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { commitUpdate ( commit: { streamId: "${streamId}", id: "${commitId}", message: "updating this commit" } ) }`
      })
        .expect(200)
        .expect(noErrors)
      await sendRequest(userA.token, {
        query: `mutation { commitUpdate ( commit: { streamId: "${streamId}", id: "${commitId}", message: "updating this commit v2" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(2)
      consumer.unsubscribe()
    }).timeout(5000)

    it('Should be notified when a commit is deleted', async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const resOC = await sendRequest(userA.token, {
        query: `mutation { objectCreate( objectInput: {streamId: "${streamId}", objects: {hello: "goodbye 🌊"}} ) }`
      })
      const objId = resOC.body.data.objectCreate
      const resCC = await sendRequest(userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "main", objectId: "${objId}" } ) }`
      })
      const commitId = resCC.body.data.commitCreate

      let eventNum = 0
      const query = gql`subscription { commitDeleted( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userA.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.commitDeleted).to.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { commitDelete ( commit: { streamId: "${streamId}", id: "${commitId}" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(1)
      consumer.unsubscribe()
    }).timeout(5000)

    it("Should *not* be notified when a commit is created on a stream you're not authorised for", async () => {
      const resSC = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }'
      })
      const streamId = resSC.body.data.streamCreate
      const resOC = await sendRequest(userA.token, {
        query: `mutation { objectCreate( objectInput: {streamId: "${streamId}", objects: {hello: "goodbye 🌊"}} ) }`
      })
      const objId = resOC.body.data.objectCreate

      let eventNum = 0
      const query = gql`subscription { commitCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable(wsAddr, userB.token, query)
      const consumer = client.subscribe((eventData) => {
        expect(eventData.data.commitCreated).to.not.exist
        eventNum++
      })

      await sleep(500)

      await sendRequest(userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "main", objectId: "${objId}" } ) }`
      })
        .expect(200)
        .expect(noErrors)

      await sleep(1000) // we need to wait up a second here
      expect(eventNum).to.equal(0)
      consumer.unsubscribe()
    }).timeout(5000)
  })
})

/**
 * Sends a graphql request. Convenience wrapper.
 * @param  {string} auth the user's token
 * @param  {string} obj  the query/mutation to send
 * @return {Promise}      the awaitable request
 */
function sendRequest(auth, obj, address = addr) {
  return request(address)
    .post('/graphql')
    .set({ Authorization: auth, Accept: 'application/json' })
    .send(obj)
}
