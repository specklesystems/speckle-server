const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const root = require( 'app-root-path' )
const { init } = require( `${root}/app` )
const knex = require( `${root}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../users/services' )
const { createStream, getStream, updateStream, deleteStream, getStreamsUser, grantPermissionsStream, revokePermissionsStream } = require( '../streams/services' )

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
        let sid = await updateStream( testStream.id, { name: "Modified Name", description: 'Wooot' } )
        let stream = await getStream( testStream.id )
        expect( stream.name ).to.equal( 'Modified Name' )
        expect( stream.description ).to.equal( 'Wooot' )
      } )

      it( 'Should get all streams for a user', async ( ) => {
        let all = await getStreamsUser( userOne.id )
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
        let userTwoStreams = await getStreamsUser( userTwo.id )
        expect( userTwoStreams ).to.have.lengthOf( 1 )
        expect( userTwoStreams[ 0 ] ).to.have.property( 'role' )
        expect( userTwoStreams[ 0 ].role ).to.equal( 'write' )
      } )

      it( 'Should revoke permissions on stream', async ( ) => {
        await revokePermissionsStream( testStream.id, userTwo.id )
        let userTwoStreams = await getStreamsUser( userTwo.id )
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

      it( 'A stream should not have more than one owner', async ( ) => {
        let newStream = { name: 'XXX' }
        newStream.id = await createStream( newStream, userOne.id )
        await grantPermissionsStream( newStream.id, userTwo.id, 'owner' )

        let usrStreams1 = await getStreamsUser( userOne.id )
        let s1 = usrStreams1.find( s => s.name === 'XXX' )
        let usrStreams2 = await getStreamsUser( userTwo.id )
        let s2 = usrStreams2.find( s => s.name === 'XXX' )

        expect( s1.role ).to.not.equal( 'owner' )
        expect( s1.role ).to.not.equal( s2.role )
      } )

    } )

  } )

  describe( 'Integration (API)', ( ) => {

    // The express app
    let app
    let token
    
    before( async ( ) => {
      app = init( )
      token = await createToken( userOne.id, 'Generic Token', [ 'streams:read', 'streams:write' ] )
    } )

    let myTestStream = { name: 'woowowo', id: 'noids', description: 'wonderful test stream' }

    it( 'Should create a stream', async ( ) => {
      const res = await chai.request( app ).post( '/streams' ).set( 'Authorization', `Bearer ${token}` ).send( myTestStream )
      expect( res ).to.have.status( 201 )
      expect( res.body ).to.have.property( 'id' )
      myTestStream.id = res.body.id
    } )

    it( 'Should get a stream', async ( ) => {
      assert.fail( 'Not implemented yet.' )

      const res = await chai.request( app ).get( `/streams/${myTestStream.id}` ).set( 'Authorization', `Bearer ${token}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )
      expect( res.body ).to.have.property( 'name' )
    } )

    it( 'Should update a stream', async ( ) => {
      assert.fail( 'Not implemented yet.' )

      const res = await chai.request( app ).put( `/streams/${myTestStream.id}` ).send( { name: 'new name' } )
      const resUpdated = await chai.request( app ).get( `/streams/${myTestStream.id}` )

      expect( res ).to.have.status( 200 )
      expect( res.body ).to.have.property( 'id' )

      expect( resUpdated ).to.have.status( 200 )
      expect( resUpdated ).to.have.property( 'name' )
      expect( resUpdated.name ).to.equal( 'new name' )
    } )

    it( 'Should delete a stream', async ( ) => {
      assert.fail( 'Not implemented yet.' )
    } )



  } )

} )