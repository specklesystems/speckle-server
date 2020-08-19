/* istanbul ignore file */
const crypto = require( 'crypto' )
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const WebSocket = require( 'ws' )
const { SubscriptionClient } = require( 'subscriptions-transport-ws' )
const { ApolloClient } = require( 'apollo-client' )
const { InMemoryCache } = require( 'apollo-cache-inmemory' )
const { createHttpLink } = require( 'apollo-link-http' )
const gql = require( 'graphql-tag' )
const fetch = require( 'node-fetch' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser } = require( '../services/users' )
const { createPersonalAccessToken } = require( '../services/tokens' )
const { createObject, createObjects } = require( '../services/objects' )

let addr
let wsAddr

describe( 'GraphQL API Subscriptions', ( ) => {
  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', username: 'd2', email: 'd.2@speckle.systems', password: 'wow' }
  let userC = { name: 'd3', username: 'd3', email: 'd.3@speckle.systems', password: 'wow' }
  let testServer

  let client
  let apolloClient

  // set up app & two basic users to ping pong permissions around
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    let { app } = await init( )
    let { server } = await startHttp( app )
    testServer = server

    userA.id = await createUser( userA )
    userA.token = `Bearer ${( await createPersonalAccessToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
    userB.id = await createUser( userB )
    userB.token = `Bearer ${( await createPersonalAccessToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
    userC.id = await createUser( userC )
    userC.token = `Bearer ${( await createPersonalAccessToken( userC.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`

    addr = `http://localhost:${process.env.PORT || 3000}`
    wsAddr = `ws://localhost:${process.env.PORT || 3000}`

    client = new SubscriptionClient( `${addr}/graphql`, { reconnect: true }, WebSocket )
    // NOTE: Client is authorizing as userA!
    apolloClient = new ApolloClient( { networkInterface: client, cache: new InMemoryCache( ), link: createHttpLink( { uri: `${addr}/graphql`, headers: { "Authorization": userA.token }, fetch: fetch } ) } )
  } )

  after( async ( ) => {
    client.close( )
    testServer.close( )
  } )

  describe( 'Subscriptions', ( ) => {

    describe( 'Streams', ( ) => {
      // so these sub requests obv don't work -- i thought it would be as easy as replacing the address with the ws address but i was very wrong 🙃
      // sending like a regular request rn just so tests can be written

      it( 'Should be notified when a stream is created', ( done ) => {
        // const subSC = await sendRequest( userA.token, { query: `subscription streamCreated { streamCreated ( ownerId: "${userA.id}" ) }` } )

        let events = [ ]

        apolloClient
          .subscribe( { query: gql `subscription mySub { userStreamCreated ( ownerId: "${userA.id}" ) }` } )
          .subscribe( {
            next( data ) {
              console.log( 'subscription event data: ' )
              console.log( data )
              events.push( data )
            },
            error( err ) {
              console.log( 'subscription error event data: ' )
              console.log( err )
            }
          } )

        sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
          .then( res => {
            return sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
          } )
          .then( res => {
            // setTimeout( function ( ) {
            //   expect( events.length ).to.equal( 2 )
            //   done( )
            // }, 3000 )
          } )

        // console.log( subSC.body.errors )
        // expect( await subSC ).to.be.json
        // expect( subSC.body.errors ).to.not.exist
        // expect( subSC.body.data ).to.have.property( 'streamCreated' )
        // expect( subSC.body.data.streamCreated ).to.exist

      } ).timeout( 5000 )

      it( 'Should not be notified when another user creates a stream', async ( ) => {
        const subSCB = await sendRequest( userB.token, { query: `subscription streamCreated { streamCreated ( ownerId: "${userB.id}" ) }` } )
        const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )

        expect( await subSCB ).to.be.json
        expect( subSCB.body.errors ).to.not.exist
        expect( subSCB.body.data.streamCreated ).to.not.exist
      } )

      it( 'Should be notified when a stream is updated', async ( ) => {
        const subSC = await sendRequest( userA.token, { query: `subscription streamCreated { streamCreated ( ownerId: "${userA.id}" ) }` } )
        const resSC = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "Subs Test (u A) Private", description: "Hello World", isPublic:false } ) }` } )
        const streamId = resSC.body.data.streamCreate

        const subSU = await sendRequest( userA.token, { query: `subscription streamUpdated { streamUpdated( streamId: "${streamId}" ) }` } )
        const resSU = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: { id: "${streamId}", description: "updated this stream" } ) }` } )

        console.log( resSU.body )
        expect( await subSU ).to.be.json
        expect( subSU.body.errors ).to.not.exist
        expect( subSU.body.data ).to.have.property( 'streamUpdated' )
        expect( subSU.body.data.streamUpdated ).to.exist
      } )
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

// const crypto = require( 'crypto' )

function generateManyObjects( shitTon, noise ) {
  shitTon = shitTon || 10000
  noise = noise || Math.random( ) * 100

  let objs = [ ]

  let base = { name: 'base bastard 2', noise: noise, __closure: {} }
  // objs.push( base )
  let k = 0

  for ( let i = 0; i < shitTon; i++ ) {
    let baby = {
      name: `mr. ${i}`,
      nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [ i + 42, i, i ] },
      test: { value: i, secondValue: 'mallard ' + i % 10 },
      similar: k,
      even: i % 2 === 0,
      objArr: [ { a: i }, { b: i * i }, { c: true } ],
      noise: noise,
      sortValueA: i,
      sortValueB: i * 0.42 * i
    }
    if ( i % 3 === 0 ) k++

    getAnIdForThisOnePlease( baby )

    base.__closure[ baby.id ] = 1

    objs.push( baby )
  }

  getAnIdForThisOnePlease( base )
  return { commit: base, objs: objs }
}

function getAnIdForThisOnePlease( obj ) {
  obj.id = obj.id || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
}
