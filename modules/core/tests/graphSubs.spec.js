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
    this.timeout( 5000 ) // we need to wait for the server to start in the child process!

    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    const childProcess = require( 'child_process' )
    serverProcess = childProcess.exec( "npm run dev:server:test" )

    await sleep( 2000 )

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

      let sc1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc1.body.errors ).to.not.exist

      let sc2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc2.body.errors ).to.not.exist

      await sleep( 1000 ) // we need to wait up a second here
      expect( eventNum ).to.equal( 2 )

      consumer.unsubscribe( )
    } ).timeout( 2000 )

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
