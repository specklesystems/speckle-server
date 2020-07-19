/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createPersonalAccessToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../services/users' )
const { createStream, getStream, updateStream, deleteStream, getUserStreams, getStreamUsers, grantPermissionsStream, revokePermissionsStream } = require( '../services/streams' )

describe( 'Streams', ( ) => {

  let userOne = {
    username: 'dim',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    userOne.id = await createUser( userOne )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  let testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream',
    isPublic: true
  }

  let secondTestStream = { name: 'Test Stream 02', description: 'wot' }


  describe( 'Base CRUD', ( ) => {
    it( 'Should create a stream', async ( ) => {
      testStream.id = await createStream( { ...testStream, ownerId: userOne.id } )
      expect( testStream ).to.have.property( 'id' )
      expect( testStream.id ).to.not.be.null

      secondTestStream.id = await createStream( { ...secondTestStream, ownerId: userOne.id } )
      expect( secondTestStream.id ).to.not.be.null
    } )

    it( 'Should get a stream', async ( ) => {
      let stream = await getStream( { streamId: testStream.id } )
      expect( stream ).to.not.be.null
    } )

    it( 'Should update a stream', async ( ) => {
      let sid = await updateStream( { streamId: testStream.id, name: "Modified Name", description: 'Wooot' } )
      let stream = await getStream( { streamId: testStream.id } )
      expect( stream.name ).to.equal( 'Modified Name' )
      expect( stream.description ).to.equal( 'Wooot' )
    } )

    it( 'Should get all streams for a user', async ( ) => {
      let all = await getUserStreams( { userId: userOne.id } )
      expect( all ).to.have.lengthOf( 2 )
    } )

    it( 'Should delete a stream', async ( ) => {
      const id = await createStream( { name: 'mayfly', description: 'wonderful', ownerId: userOne.id } )
      let all = await getUserStreams( { userId: userOne.id } )
      expect( all ).to.have.lengthOf( 3 )

      await deleteStream( { streamId: id } )

      all = await getUserStreams( { userId: userOne.id } )
      expect( all ).to.have.lengthOf( 2 )
    } )
  } )

  describe( 'Sharing', ( ) => {
    let userTwo = {
      username: 'dimsecond',
      name: 'Dimitrie Stefanescu 2',
      email: 'didimitrie2@gmail.com',
      password: 'sn3aky-1337-b1m'
    }

    before( async ( ) => {
      userTwo.id = await createUser( userTwo )
    } )

    it( 'Should share a stream with a user', async ( ) => {
      await grantPermissionsStream( { streamId: testStream.id, userId: userTwo.id, role: 'stream:reviewer' } )
      await grantPermissionsStream( { streamId: testStream.id, userId: userTwo.id, role: 'stream:contributor' } ) // change perms
    } )

    it( 'Stream should show up in the other users` list', async ( ) => {
      let userTwoStreams = await getUserStreams( { userId: userTwo.id } )
      expect( userTwoStreams ).to.have.lengthOf( 1 )
      expect( userTwoStreams[ 0 ] ).to.have.property( 'role' )
      expect( userTwoStreams[ 0 ].role ).to.equal( 'stream:contributor' )
    } )

    it( 'Should get the users with access to a stream', async ( ) => {
      let users = await getStreamUsers( { streamId: testStream.id } )
      expect( users ).to.have.lengthOf( 2 )
      expect( users[ 0 ] ).to.not.have.property( 'email' )
      expect( users[ 0 ] ).to.have.property( 'id' )
    } )

    it( 'Should revoke permissions on stream', async ( ) => {
      await revokePermissionsStream( { streamId: testStream.id, userId: userTwo.id } )
      let userTwoStreams = await getUserStreams( { userId: userTwo.id } )
      expect( userTwoStreams ).to.have.lengthOf( 0 )
    } )

    it( 'Should not revoke owner permissions', async ( ) => {
      try {
        await revokePermissionsStream( { streamId: testStream.id, userId: userOne.id } )
        assert.fail( )
      } catch {
        // pass
      }
    } )
  } )
} )