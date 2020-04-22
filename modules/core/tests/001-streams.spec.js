const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const root = require( 'app-root-path' )
const { init } = require( `${root}/app` )
const knex = require( `${root}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../users/services' )
const { createStream, getStream, updateStream, deleteStream, getUserStreams, getStreamUsers, grantPermissionsStream, revokePermissionsStream } = require( '../streams/services' )

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

  describe( 'Services/Queries', ( ) => {
    let testStream = {
      name: 'Test Stream 01',
      description: 'wonderful test stream'
    }

    let secondTestStream = { name: 'Test Stream 02' }

    before( async ( ) => {

    } )

    describe( 'Base CRUD', ( ) => {
      it( 'Should create a stream', async ( ) => {
        testStream.id = await createStream( testStream, userOne.id )
        expect( testStream ).to.have.property( 'id' )
        expect( testStream.id ).to.not.be.null

        secondTestStream.id = await createStream( secondTestStream, userOne.id )
        expect( secondTestStream.id ).to.not.be.null
      } )

      it( 'Should get a stream', async ( ) => {
        let stream = await getStream( testStream.id )
        expect( stream ).to.not.be.null
      } )

      it( 'Should update a stream', async ( ) => {
        let sid = await updateStream( { id: testStream.id, name: "Modified Name", description: 'Wooot' } )
        let stream = await getStream( testStream.id )
        expect( stream.name ).to.equal( 'Modified Name' )
        expect( stream.description ).to.equal( 'Wooot' )
      } )

      it( 'Should get all streams for a user', async ( ) => {
        let all = await getUserStreams( userOne.id )
        expect( all ).to.have.lengthOf( 2 )
      } )

      it( 'Should delete a stream', async ( ) => {
        const id = await createStream( { name: 'to delete' }, userOne.id )
        let all = await getUserStreams( userOne.id )
        expect( all ).to.have.lengthOf( 3 )

        await deleteStream( id )

        all = await getUserStreams( userOne.id )
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
        await grantPermissionsStream( testStream.id, userTwo.id, 'read' )
        await grantPermissionsStream( testStream.id, userTwo.id, 'write' ) // change perms
      } )

      it( 'Stream should show up in the other users` list', async ( ) => {
        let userTwoStreams = await getUserStreams( userTwo.id )
        expect( userTwoStreams ).to.have.lengthOf( 1 )
        expect( userTwoStreams[ 0 ] ).to.have.property( 'role' )
        expect( userTwoStreams[ 0 ].role ).to.equal( 'write' )
      } )

      it( 'Should get the users with access to a stream', async ( ) => {
        let users = await getStreamUsers( testStream.id )
        expect( users ).to.have.lengthOf( 2 )
        expect( users[ 0 ] ).to.not.have.property( 'email' )
        expect( users[ 0 ] ).to.have.property( 'id' )
      } )

      it( 'Should revoke permissions on stream', async ( ) => {
        await revokePermissionsStream( testStream.id, userTwo.id )
        let userTwoStreams = await getUserStreams( userTwo.id )
        expect( userTwoStreams ).to.have.lengthOf( 0 )
      } )

      it( 'Should not revoke owner permissions', async ( ) => {
        try {
          await revokePermissionsStream( testStream.id, userOne.id )
          assert.fail( )
        } catch {
          // pass
        }
      } )

      // it( '🤔 DUBIOUS DESIGN DECISION: A stream should not have more than one owner', async ( ) => {
      //   let newStream = { name: 'XXX' }
      //   newStream.id = await createStream( newStream, userOne.id )
      //   await grantPermissionsStream( newStream.id, userTwo.id, 'owner' )

      //   let usrStreams1 = await getUserStreams( userOne.id )
      //   let s1 = usrStreams1.find( s => s.name === 'XXX' )
      //   let usrStreams2 = await getUserStreams( userTwo.id )
      //   let s2 = usrStreams2.find( s => s.name === 'XXX' )

      //   expect( s1.role ).to.not.equal( 'owner' )
      //   expect( s1.role ).to.not.equal( s2.role )
      // } )

    } )

  } )

  describe( 'Integration (API)', ( ) => {

    // The express app
    let app

    let userA = { username: 'A', name: 'DimitrieA ', email: 'didimitrie+a@gmail.com', password: 'sn3aky-1337-b1m' }
    let userB = { username: 'B', name: 'DimitrieB ', email: 'didimitrie+b@gmail.com', password: 'sn3aky-1337-b1m' }

    let tokenA
    let tokenB

    before( async ( ) => {
      app = init( )
      userA.id = await createUser( userA )
      userB.id = await createUser( userB )

      tokenA = await createToken( userA.id, 'Generic Token', [ 'streams:read', 'streams:write' ] )
      tokenB = await createToken( userB.id, 'Generic Token', [ 'streams:read', 'streams:write' ] )
    } )

    let privateStream = { name: 'woowowo', id: 'noids', description: 'wonderful test stream', isPublic: false }
    let publicStream = { name: 'i am public', isPublic: true }

    it( 'Should create a stream', async ( ) => {
      const res = await chai.request( app ).post( '/streams' ).set( 'Authorization', `Bearer ${tokenA}` ).send( privateStream )
      expect( res ).to.have.status( 201 )
      expect( res.body ).to.have.property( 'id' )
      privateStream.id = res.body.id

      const second = await chai.request( app ).post( '/streams' ).set( 'Authorization', `Bearer ${tokenA}` ).send( publicStream )
      expect( second ).to.have.status( 201 )
      expect( second.body ).to.have.property( 'id' )
      publicStream.id = second.body.id

    } )

    it( 'Should get a stream', async ( ) => {
      const res = await chai.request( app ).get( `/streams/${privateStream.id}` ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )
      expect( res.body ).to.have.property( 'name' )
    } )

    it( 'Should get the all the streams of an user', async ( ) => {
      const res = await chai.request( app ).get( `/streams` ).set( 'Authorization', `Bearer ${tokenA}` )
      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.lengthOf( 2 )
    } )

    it( 'Should get a public stream, even if user is anonymous', async ( ) => {
      const res = await chai.request( app ).get( `/streams/${publicStream.id}` )
      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )
      expect( res.body ).to.have.property( 'name' )
    } )

    it( 'Should not get a private stream if user is not authenticated', async ( ) => {
      const res = await chai.request( app ).get( `/streams/${privateStream.id}` )
      expect( res ).to.have.status( 401 )
    } )

    it( 'Should not get a private stream if the user does not have access to it', async ( ) => {
      const res = await chai.request( app ).get( `/streams/${privateStream.id}` ).set( 'Authorization', `Bearer ${tokenB}` )
      expect( res ).to.have.status( 401 )
    } )

    it( 'Should update a stream', async ( ) => {
      const res = await chai.request( app ).put( `/streams/${publicStream.id}` ).send( { name: 'new name' } ).set( 'Authorization', `Bearer ${tokenA}` )
      const resUpdated = await chai.request( app ).get( `/streams/${publicStream.id}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )

      expect( resUpdated ).to.have.status( 200 )
      expect( resUpdated.body ).to.have.property( 'name' )
      expect( resUpdated.body.name ).to.equal( 'new name' )
    } )

    it( 'Should grant permissions on a stream', async ( ) => {
      const shareRes = await chai.request( app ).post( `/streams/${privateStream.id}/users` ).send( { id: userB.id, role: 'read' } ).set( 'Authorization', `Bearer ${tokenA}` )
      expect( shareRes ).to.have.status( 201 )

      const userBRes = await chai.request( app ).get( `/streams/${privateStream.id}` ).set( 'Authorization', `Bearer ${tokenB}` )
      expect( userBRes ).to.have.status( 200 )
      expect( userBRes.body ).to.have.property( 'name' )
      expect( userBRes.body ).to.have.property( 'description' )
    } )

    it( 'Should get all users with access to a stream', async ( ) => {
      const userRes = await chai.request( app ).get( `/streams/${privateStream.id}/users` ).set( 'Authorization', `Bearer ${tokenB}` )
      expect( userRes ).to.have.status( 200 )
      expect( userRes.body ).to.have.lengthOf( 2 )
    } )

    it( 'Should revoke permissions on a stream', async ( ) => {
      const revokeRes = await chai.request( app ).delete( `/streams/${privateStream.id}/users` ).send( { id: userB.id, role: 'read' } ).set( 'Authorization', `Bearer ${tokenA}` )
      expect( revokeRes ).to.have.status( 200 )

      const userBRes = await chai.request( app ).get( `/streams/${privateStream.id}` ).set( 'Authorization', `Bearer ${tokenB}` )
      expect( userBRes ).to.have.status( 401 )
    } )

    it( 'Should delete a stream', async ( ) => {
      const delRes = await chai.request( app ).delete( `/streams/${privateStream.id}` ).set( 'Authorization', `Bearer ${tokenA}` )

      expect( delRes ).to.have.status( 200 )

      const streamRes = await chai.request( app ).get( `/streams/${privateStream.id }` ).set( 'Authorization', `Bearer ${tokenA}` )
      expect( streamRes ).to.have.status( 404 )
    } )

  } )

} )