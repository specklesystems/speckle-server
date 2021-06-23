/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { createUser } = require( '../../core/services/users' )
const { createPersonalAccessToken } = require( '../../core/services/tokens' )
const { createStream, grantPermissionsStream } = require( '../../core/services/streams' )
const { createObject } = require( '../../core/services/objects' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


describe( 'Activity @activity', () => {
  let userIz = {
    name: 'Izzy Lyseggen',
    email: 'izzyzzi@speckle.systems',
    password: 'sp0ckle sucks 9001'
  }

  let userCr = {
    name: 'Cristi Balas',
    email: 'cristib@speckle.systems',
    password: 'hack3r man 666'
  }

  let userX = {
    name: 'Mystery User',
    email: 'mysteriousDude@speckle.systems',
    password: 'super $ecret pw0rd'
  }

  let streamPublic = {
    name: 'a fun stream for sharing',
    description: 'for all to see!',
    isPublic: true
  }

  let streamSecret = {
    name: 'a secret stream for me',
    description: 'for no one to see!',
    isPublic: false
  }

  let testObj = {
    hello: 'hallo',
    cool: 'kult',
    bunny: 'kanin'
  }
  let testObj2 = {
    goodbye: 'ha det bra',
    warm: 'varmt',
    bunny: 'kanin'
  }

  before( async () => {
    await knex.migrate.rollback( )
    await knex.migrate.latest()

    await init()

    // create users and tokens
    userIz.id = await createUser( userIz )
    let token = await createPersonalAccessToken( userIz.id, 'izz test token', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] )
    userIz.token = `Bearer ${token}`

    userCr.id = await createUser( userCr )
    userCr.token = `Bearer ${( await createPersonalAccessToken( userCr.id, 'cristi test token', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`

    userX.id = await createUser( userX )
    userX.token = `Bearer ${( await createPersonalAccessToken( userX.id, 'no users test token', [ 'streams:read', 'streams:write' ] ) )}`

    // create some activity
    streamPublic.id = await createStream( { ...streamPublic, ownerId: userIz.id } )
    await grantPermissionsStream( { streamId: streamPublic.id, userId: userCr.id, role: 'stream:contributor' } )
    streamSecret.id = await createStream( { ...streamSecret, ownerId: userCr.id } )
    testObj.id = await createObject( streamPublic.id, testObj )
    testObj2.id = await createObject( streamSecret.id, testObj2 )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  it( 'Should get a user\'s activity', async () => {

  } )

  it( 'Should get a stream\'s activity', async () => {

  } )

  it( 'Should get a branch\'s activity', async () => {

  } )

  it( 'Should *not* get a stream\'s activity if you don\'t have access to it', async () => {

  } )

  it( 'Should *not* get a user\'s activity without the `users:read` scope', async () => {

  } )
} )
