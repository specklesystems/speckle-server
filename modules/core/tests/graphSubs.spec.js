/* eslint-disable no-undef */
/* istanbul ignore file */
const crypto = require( 'crypto' )
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const gql = require( 'graphql-tag' )
const { execute } = require( 'apollo-link' )
const { WebSocketLink } = require( 'apollo-link-ws' )
const { SubscriptionClient } = require( 'subscriptions-transport-ws' )
const ws = require( 'ws' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser } = require( '../services/users' )
const { createPersonalAccessToken, validateToken } = require( '../services/tokens' )
const { createObject, createObjects } = require( '../services/objects' )

// const addr = `http://localhost:${process.env.PORT || 3000}`
// const wsAddr = `ws://localhost:${process.env.PORT || 3000}`
const addr = `http://localhost:3002/graphql`
const wsAddr = `ws://localhost:3002/graphql`

describe( 'GraphQL API Subscriptions', ( ) => {
  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', username: 'd2', email: 'd.2@speckle.systems', password: 'wow' }
  let serverProcess

  const getWsClient = ( wsurl, authToken ) => {
    const client = new SubscriptionClient( wsAddr, {
        reconnect: true,
        connectionParams: { headers: { Authorization: authToken } }
      },
      ws )
    return client
  }

  const createSubscriptionObservable = ( wsurl, authToken, query, variables ) => {
    authToken = authToken || userA.token
    const link = new WebSocketLink( getWsClient( wsurl, authToken ) )
    return execute( link, { query: query, variables: variables } )
  }

  // set up app & two basic users to ping pong permissions around
  before( async function ( ) {
    this.timeout( 10000 ) // we need to wait for the server to start in the child process!

    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    const childProcess = require( 'child_process' )
    serverProcess = childProcess.spawn( "npm", [ "run", "dev:server:test" ], { cwd: `${appRoot}` } )

    serverProcess.stdout.on( 'data', data => {
      console.log( `stdout: ${data}` )
    } )

    serverProcess.stderr.on( 'data', ( data ) => {
      console.error( `stderr: ${data}` )
    } )

    serverProcess.on( 'close', ( code ) => {
      console.log( `child process exited with code ${code}` )
    } )

    await sleep( 5000 )

    userA.id = await createUser( userA )
    let token = await createPersonalAccessToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] )
    userA.token = `Bearer ${token}`

    userB.id = await createUser( userB )
    userB.token = `Bearer ${( await createPersonalAccessToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
  } )

  after( async ( ) => {
    serverProcess.kill( )
  } )

  describe( 'Streams', ( ) => {

    it( 'Should be notified when a stream is created', async ( ) => {
      let eventNum = 0
      const query = gql `subscription mySub { userStreamCreated ( ownerId: "${userA.id}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        // console.log( 'Create subscription log' )
        // console.log( eventData )
        expect( eventData.data.userStreamCreated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let sc1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc1.body.errors ).to.not.exist

      let sc2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc2.body.errors ).to.not.exist

      await sleep( 2500 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )

      consumer.unsubscribe( )
    } ).timeout( 5000 )

    it( 'Should be notified when a stream is updated', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql `subscription streamUpdated { streamUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        // console.log( 'update subscription log' )
        // console.log( eventData )
        expect( eventData.data.streamUpdated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      const resSU = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream" } ) }` } )
      expect( resSU.body.errors ).to.not.exist
      const resSU_2 = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream... again!" } ) }` } )
      expect( resSU_2.body.errors ).to.not.exist

      const resSU_3 = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream... again!" } ) }` } )
      expect( resSU_3.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 3 )
      consumer.unsubscribe( )
    } )

    it( 'Should be notified when a stream is deleted', async ( ) => {
      const sc1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const sc2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )

      const sid1 = sc1.body.data.streamCreate
      const sid2 = sc2.body.data.streamCreate

      let eventNum = 0
      const query = gql `subscription userStreamDeleted { userStreamDeleted( ownerId: "${userA.id}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.userStreamDeleted ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let sd1 = await sendRequest( userA.token, { query: `mutation { streamDelete(id: "${sid1}" ) }` } )
      expect( sd1.body.errors ).to.not.exist

      let sd2 = await sendRequest( userA.token, { query: `mutation { streamDelete(id: "${sid2}" ) }` } )
      expect( sd2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )

    it( 'Should *not* be notified of stream creation if invalid token', async ( ) => {
      const query = gql `subscription mySub { userStreamCreated ( ownerId: "${userA.id}" ) }`
      const client = createSubscriptionObservable( wsAddr, "faketoken123", query )
      const consumer = client.subscribe( eventData => {
        // console.log( 'Create subscription log' )
        // console.log( eventData )
        expect( eventData.data.userStreamCreated ).to.not.exist
      } )

      await sleep( 500 )

      let sc1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc1.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      consumer.unsubscribe( )
    } )
  } )

  describe( 'Branches', ( ) => {
    it( 'Should be notified when a branch is created', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate

      let eventNum = 0
      const query = gql `subscription { branchCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.branchCreated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let bc1 = await sendRequest( userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      } )
      expect( bc1.body.errors ).to.not.exist
      let bc2 = await sendRequest( userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "another branch 🥬", description: "this is a test branch 🌳" } ) }`
      } )
      expect( bc2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )

    it( 'Should be notified when a branch is updated', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate
      const bc1 = await sendRequest( userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      } )
      const branchId = bc1.body.data.branchCreate

      let eventNum = 0
      const query = gql `subscription { branchUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.branchUpdated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let bu1 = await sendRequest( userA.token, {
        query: `mutation { branchUpdate ( branch: { streamId: "${streamId}", id: "${branchId}", description: "updating this branch" } ) }`
      } )
      expect( bu1.body.errors ).to.not.exist
      let bu2 = await sendRequest( userA.token, {
        query: `mutation { branchUpdate ( branch: { streamId: "${streamId}", id: "${branchId}", description: "updating this branch v2" } ) }`
      } )
      expect( bu2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )

    it( 'Should be notified when a branch is deleted', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate
      const bc1 = await sendRequest( userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "new branch 🌿", description: "this is a test branch 🌳" } ) }`
      } )
      const bc2 = await sendRequest( userA.token, {
        query: `mutation { branchCreate ( branch: { streamId: "${streamId}", name: "another branch 🥬", description: "this is a test branch 🌳" } ) }`
      } )
      const bid1 = bc1.body.data.branchCreate
      const bid2 = bc2.body.data.branchCreate

      let eventNum = 0
      const query = gql `subscription { branchDeleted( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.branchDeleted ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let bd1 = await sendRequest( userA.token, {
        query: `mutation { branchDelete ( branch: { streamId: "${streamId}", id: "${bid1}" } ) }`
      } )
      expect( bd1.body.errors ).to.not.exist
      let bd2 = await sendRequest( userA.token, {
        query: `mutation { branchDelete ( branch: { streamId: "${streamId}", id: "${bid2}" } ) }`
      } )
      expect( bd2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )
  } )

  describe( 'Commits', ( ) => {
    it( 'Should be notified when a commit is created', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate
      const resOC1 = await sendRequest( userA.token, { query: `mutation { objectCreate(streamId: "${streamId}", objects: {hello: "goodbye 🌊"} ) }` } )
      const resOC2 = await sendRequest( userA.token, { query: `mutation { objectCreate(streamId: "${streamId}", objects: {wow: "cool 🐟"} ) }` } )
      const objId1 = resOC1.body.data.objectCreate
      const objId2 = resOC2.body.data.objectCreate

      let eventNum = 0
      const query = gql `subscription { commitCreated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.commitCreated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let cc1 = await sendRequest( userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "master", objectId: "${objId1}" } ) }`
      } )
      expect( cc1.body.errors ).to.not.exist
      let cc2 = await sendRequest( userA.token, {
        query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "master", objectId: "${objId2}" } ) }`
      } )
      expect( cc2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )

    it( 'Should be notified when a commit is updated', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate
      const resOC = await sendRequest( userA.token, { query: `mutation { objectCreate(streamId: "${streamId}", objects: {hello: "goodbye 🌊"} ) }` } )
      const objId = resOC.body.data.objectCreate
      const resCC = await sendRequest( userA.token, { query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "master", objectId: "${objId}" } ) }` } )
      const commitId = resCC.body.data.commitCreate

      let eventNum = 0
      const query = gql `subscription { commitUpdated( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.commitUpdated ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let cu1 = await sendRequest( userA.token, {
        query: `mutation { commitUpdate ( commit: { streamId: "${streamId}", id: "${commitId}", message: "updating this commit" } ) }`
      } )
      expect( cu1.body.errors ).to.not.exist
      let cu2 = await sendRequest( userA.token, {
        query: `mutation { commitUpdate ( commit: { streamId: "${streamId}", id: "${commitId}", message: "updating this commit v2" } ) }`
      } )
      expect( cu2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )
      consumer.unsubscribe( )
    } )

    it( 'Should be notified when a commit is deleted', async ( ) => {
      const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      const streamId = resSC.body.data.streamCreate
      const resOC = await sendRequest( userA.token, { query: `mutation { objectCreate(streamId: "${streamId}", objects: {hello: "goodbye 🌊"} ) }` } )
      const objId = resOC.body.data.objectCreate
      const resCC = await sendRequest( userA.token, { query: `mutation { commitCreate ( commit: { streamId: "${streamId}", branchName: "master", objectId: "${objId}" } ) }` } )
      const commitId = resCC.body.data.commitCreate

      let eventNum = 0
      const query = gql `subscription { commitDeleted( streamId: "${streamId}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      const consumer = client.subscribe( eventData => {
        expect( eventData.data.commitDeleted ).to.exist
        eventNum++
      } )

      await sleep( 500 )

      let cd = await sendRequest( userA.token, {
        query: `mutation { commitDelete ( commit: { streamId: "${streamId}", id: "${commitId}" } ) }`
      } )
      expect( cd.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 1 )
      consumer.unsubscribe( )
    } )
  } )
} )

/**
 * Sends a graphql request. Convenience wrapper.
 * @param  {string} auth the user's token
 * @param  {string} obj  the query/mutation to send
 * @return {Promise}      the awaitable request
 */
function sendRequest( auth, obj, address = addr ) {
  return chai.request( address ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )
}

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}
