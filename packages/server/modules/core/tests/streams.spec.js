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
const { createStream, getStream, updateStream, deleteStream, deleteStreams, getUserStreams, getStreamUsers, grantPermissionsStream, revokePermissionsStream } = require( '../services/streams' )
const { createBranch, getBranchByNameAndStreamId, updateBranch, deleteBranchById } = require( '../services/branches' )
const { createObject, createObjects } = require( '../services/objects' )
const { createCommitByBranchName } = require( '../services/commits' )

describe( 'Streams @core-streams', ( ) => {
  let userOne = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let userTwo = {
    name: 'Dimitrie Stefanescu 2',
    email: 'didimitrie2@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    await init()

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

  describe( 'Create, Read, Update, Delete Streams', ( ) => {
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
      let sid = await updateStream( { streamId: testStream.id, name: 'Modified Name', description: 'Wooot' } )
      let stream = await getStream( { streamId: testStream.id } )
      expect( stream.name ).to.equal( 'Modified Name' )
      expect( stream.description ).to.equal( 'Wooot' )
    } )

    it( 'Should get all streams of a user', async ( ) => {
      let { streams, cursor } = await getUserStreams( { userId: userOne.id } )
      // console.log( res )
      expect( streams ).to.have.lengthOf( 2 )
      expect( cursor ).to.exist
    } )

    it( 'Should search all streams of a user', async () => {
      let { streams, cursor } = await getUserStreams( { userId: userOne.id, searchQuery: 'woo' } )
      // console.log( res )
      expect( streams ).to.have.lengthOf( 1 )
      expect( cursor ).to.exist
    } )

    it( 'Should delete a stream', async ( ) => {
      const id = await createStream( { name: 'mayfly', description: 'wonderful', ownerId: userOne.id } )
      let all = await getUserStreams( { userId: userOne.id } )
      expect( all.streams ).to.have.lengthOf( 3 )

      await deleteStream( { streamId: id } )

      all = await getUserStreams( { userId: userOne.id } )
      expect( all.streams ).to.have.lengthOf( 2 )
    } )
  } )

  describe( 'Sharing: Grant & Revoke permissions', ( ) => {
    before( async ( ) => {
      userTwo.id = await createUser( userTwo )
    } )

    it( 'Should share a stream with a user', async ( ) => {
      await grantPermissionsStream( { streamId: testStream.id, userId: userTwo.id, role: 'stream:reviewer' } )
      await grantPermissionsStream( { streamId: testStream.id, userId: userTwo.id, role: 'stream:contributor' } ) // change perms
    } )

    it( 'Stream should show up in the other users` list', async ( ) => {
      let { streams: userTwoStreams } = await getUserStreams( { userId: userTwo.id } )

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
      let { streams: userTwoStreams } = await getUserStreams( { userId: userTwo.id } )
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

  describe( '`UpdatedAt` prop update', () => {
    let s = {
      name: 'T1'
    }

    it( 'Should update stream updatedAt on stream update ', async() => {
      s.id = await createStream( { ...s, ownerId: userOne.id } )
      s = await getStream( { streamId: s.id } )

      await sleep( 100 )

      await updateStream( { streamId: s.id, name: 'TU1' } )
      let su = await getStream( { streamId: s.id } )

      expect( su.updatedAt ).to.not.equal( s.updatedAt )
    } )

    it( 'Should update stream updatedAt on sharing operations ', async() => {
      s = await getStream( { streamId: s.id } )

      await grantPermissionsStream( { streamId: s.id, userId: userTwo.id, role: 'stream:contributor' } )

      await sleep( 100 )
      let su = await getStream( { streamId: s.id } )
      expect( su.updatedAt ).to.not.equal( s.updatedAt )

      await revokePermissionsStream( { streamId: s.id, userId: userTwo.id } )

      await sleep( 100 )
      su = await getStream( { streamId: s.id } )
      expect( su.updatedAt ).to.not.equal( s.updatedAt )
    } )

    it( 'Should update stream updatedAt on branch operations ', async() => {
      s = await getStream( { streamId: s.id } )

      await sleep( 100 )
      await createBranch( { name: 'dim/lol', streamId: s.id, authorId: userOne.id } )
      let su = await getStream( { streamId: s.id } )
      expect( su.updatedAt ).to.not.equal( s.updatedAt )

      await sleep( 100 )
      let b = await getBranchByNameAndStreamId( { streamId: s.id, name: 'dim/lol' } )
      await deleteBranchById( { id: b.id, streamId: s.id } )
      let su2 = await getStream( { streamId: s.id } )
      expect( su2.updatedAt ).to.not.equal( su.updatedAt )
    } )

    it( 'Should update stream updatedAt on commit operations ', async() => {
      s = await getStream( { streamId: s.id } )

      await sleep( 100 )
      let testObject = { foo: 'bar', baz: 'qux' }
      testObject.id = await createObject( s.id, testObject )
      commitId1 = await createCommitByBranchName( { streamId: s.id, branchName: 'main', message: 'first commit', objectId: testObject.id, authorId: userOne.id, sourceApplication: 'tests' } )

      su = await getStream( { streamId: s.id } )
      expect( su.updatedAt ).to.not.equal( s.updatedAt )
    } )
  } )
} )

function sleep( ms ) {
  // console.log( `\t Sleeping ${ms}ms ` )
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms )
  } )
}
