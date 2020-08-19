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
const addr = `http://localhost:3000/graphql`
const wsAddr = `ws://localhost:3000/graphql`

describe( 'GraphQL API Subscriptions', ( ) => {
  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', username: 'd2', email: 'd.2@speckle.systems', password: 'wow' }
  let userC = { name: 'd3', username: 'd3', email: 'd.3@speckle.systems', password: 'wow' }
  let testServer



  const getWsClient = ( wsurl, authToken ) => {
    const client = new SubscriptionClient( wsAddr, {
        reconnect: true,
        connectionParams: { headers: { Authorization: authToken } }
      },
      ws )
    return client
  }

  // wsurl: GraphQL endpoint
  // query: GraphQL query (use gql`` from the 'graphql-tag'  library)
  // variables: Query variables object
  const createSubscriptionObservable = ( wsurl, authToken, query, variables ) => {
    authToken = authToken || userA.token
    const link = new WebSocketLink( getWsClient( wsurl, authToken ) )
    return execute( link, { query: query, variables: variables } )
  }

  // set up app & two basic users to ping pong permissions around
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    // let { app } = await init( )
    // let { server } = await startHttp( app )
    // testServer = server

    userA.id = await createUser( userA )
    let token = await createPersonalAccessToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] )
    userA.token = `Bearer ${token}`

    userB.id = await createUser( userB )
    userB.token = `Bearer ${( await createPersonalAccessToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
  } )

  after( async ( ) => {
    // client.close( )
    // testServer.close( )
  } )



  describe( 'Streams', ( ) => {

    it( 'Should be notified when a stream is created', async ( ) => {
      const query = gql `subscription mySub { userStreamCreated ( ownerId: "${userA.id}" ) }`
      const client = createSubscriptionObservable( wsAddr, userA.token, query )
      let rageQuitNum = 0
      let consumer = client.subscribe( eventData => {
        // console.log( 'WOOOT ' )
        // console.log( eventData )
        // console.log( 'WOOOT ' )
        rageQuitNum++
      } )

      let sc1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc1.body.errors ).to.not.exist

      let sc2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( sc2.body.errors ).to.not.exist

      console.log( 'sleeping for a bit' )
      await sleep( 1000 )
      expect( rageQuitNum ).to.equal( 2 )

    } ).timeout( 5000 )

    // it( 'Should not be notified when another user creates a stream', async ( ) => {
    //   const subSCB = await sendRequest( userB.token, { query: `subscription streamCreated { streamCreated ( ownerId: "${userB.id}" ) }` } )
    //   const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )

    //   expect( await subSCB ).to.be.json
    //   expect( subSCB.body.errors ).to.not.exist
    //   expect( subSCB.body.data.streamCreated ).to.not.exist
    // } )

    // it( 'Should be notified when a stream is updated', async ( ) => {
    //   const subSC = await sendRequest( userA.token, { query: `subscription streamCreated { streamCreated ( ownerId: "${userA.id}" ) }` } )
    //   const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
    //   const streamId = resSC.body.data.streamCreate

    //   const subSU = await sendRequest( userA.token, { query: `subscription streamUpdated { streamUpdated( streamId: "${streamId}" ) }` } )
    //   const resSU = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream" } ) }` } )

    //   console.log( resSU.body )
    //   expect( await subSU ).to.be.json
    //   expect( subSU.body.errors ).to.not.exist
    //   expect( subSU.body.data ).to.have.property( 'streamUpdated' )
    //   expect( subSU.body.data.streamUpdated ).to.exist
    // } )
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
