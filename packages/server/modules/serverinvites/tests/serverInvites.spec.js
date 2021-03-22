/* istanbul ignore file */
const crs = require( 'crypto-random-string' )
const chai = require( 'chai' )
const request = require( 'supertest' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )
const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect

const knex = require( `${appRoot}/db/knex` )
const { createUser } = require( `${appRoot}/modules/core/services/users` )

const { createAndSendInvite, getInviteById, getInviteByEmail, validateInvite, useInvite } = require( `${appRoot}/modules/serverinvites/services` )
const { createStream, getStream, getStreamUsers, getUserStreams } = require( `${appRoot}/modules/core/services/streams` )
const { createPersonalAccessToken } = require( `${appRoot}/modules/core/services/tokens` )

const serverAddress = `http://localhost:${process.env.PORT || 3000}`

describe( 'Server Invites @server-invites', ( ) => {

  let myApp

  describe( 'Services @server-invites-services', () => {
    let actor = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie-100@gmail.com',
      password: 'wtfwtfwtf'
    }

    before( async() => {
      await knex.migrate.rollback( )
      await knex.migrate.latest( )

      let { app } = await init()
      myApp = app
      actor.id = await createUser( actor )
    } )

    after( async() => {
      await knex.migrate.rollback( )
    } )

    it( 'should create an invite', async() => {

      let inviteId = await createAndSendInvite( { email:'didimitrie@gmail.com', inviterId: actor.id, message: 'Hey, join!' } )
      expect( inviteId ).to.be.a( 'string' )

    } )


    it( 'should not allow multiple invites for the same email', async() => {

      let inviteId = await createAndSendInvite( { email:'cat@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )

      try {
        await createAndSendInvite( { email:'cat@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )
        assert.fail()
      } catch ( e ) {
      // pass
      }
    } )

    it( 'should not allow self invites', async() => {

      try {
        await createAndSendInvite( { email: 'didimitrie-100@gmail.com', inviterId: actor.id } )
        assert.fail()
      } catch ( e ) {
      // pass
      }
    } )

    it( 'should not allow invites from no user', async() => {

      try {
        await createAndSendInvite( { email: 'didimitrie233-100@gmail.com', inviterId: 'fake' } )
        assert.fail()
      } catch ( e ) {
      // pass
      }
    } )

    it( 'should get an invite by id', async() => {
      let inviteId = await createAndSendInvite( { email:'badger@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )
      let invite = await getInviteById( { id: inviteId } )

      expect( invite ).to.be.not.null
      expect( invite.email ).to.equal( 'badger@speckle.systems' )
      expect( invite.used ).to.equal( false )
      expect( invite.inviterId ).to.equal( actor.id )

    } )

    it( 'should get an invite by email', async() => {
      let inviteId = await createAndSendInvite( { email:'weasel@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )
      let invite = await getInviteByEmail( { email: 'weasel@speckle.systems' } )

      expect( invite ).to.be.not.null
      expect( invite.email ).to.equal( 'weasel@speckle.systems' )
      expect( invite.used ).to.equal( false )
      expect( invite.inviterId ).to.equal( actor.id )
    } )

    it( 'should validate an invite', async() => {
      let inviteId = await createAndSendInvite( { email:'raven@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )

      const valid = await validateInvite( { email: 'raven@speckle.systems', id: inviteId } )
      const invalid = await validateInvite( { email: 'bunny@speckle.systems', id: inviteId } )

      expect( valid ).to.equal( true )
      expect( invalid ).to.equal( false )
    } )

    it( 'should use an invite', async() => {
      let inviteId = await createAndSendInvite( { email:'crow@speckle.systems', inviterId: actor.id, message: 'Hey, join!' } )

      try {
        await useInvite( { id:inviteId, email:'parrot@speckle.systems' } )
        assert.fail( 'Should not allow a different email to be used than the one in the invite' )
      } catch ( e ) {
      // pass
      }

      let result =  await useInvite( { id: inviteId, email:'crow@speckle.systems' } )

      let invite = await getInviteByEmail( { email: 'crow@speckle.systems' } )
      expect( result ).equals( true )
      expect( invite.used ).equals( true )

      try {
        await useInvite( { id: inviteId, email:'crow@speckle.systems' } )
        assert.fail( 'Should not be able to use an already used invite.' )
      } catch ( e ) {
        //pass
      }
    } )

    it( 'should create a stream invite and use it', async() => {
      let stream = { name: 'test', description:'wow' }
      stream.id = await createStream( { ...stream, ownerId: actor.id } )

      let invite = { email: 'bunny@speckle.systems', inviterId: actor.id, resourceTarget: 'streams', resourceId: stream.id, role: 'stream:contributor' }
      invite.id = await createAndSendInvite( invite )

      // fake registration
      let guest = { email:'bunny@speckle.systems', name:'bunny', password: 'ten toes or more' }
      guest.id = await createUser( guest )

      await useInvite( { id: invite.id, email: guest.email } )

      let { streams, cursor } = await getUserStreams( { userId: guest.id } )
      expect( streams ).to.be.an( 'array' )
      expect( streams ).to.be.not.null
      expect( streams.length ).to.equal( 1 )
    } )
  } )

  describe( 'API @server-invites-api', () => {
    let actor = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie-10000@gmail.com',
      password: 'wtfwtfwtf'
    }

    let testServer, testToken

    before( async() => {
      // await knex.migrate.rollback( )
      await knex.migrate.latest( )

      // let { app } = await init()
      try {
        let { server } = await startHttp( myApp )
        testServer = server
      } catch ( e ) {}

      actor.id = await createUser( actor )

      testToken = `Bearer ${( await createPersonalAccessToken( actor.id, 'test token', [ 'users:invite' ] ) )}`
    } )

    after( async() => {
      await knex.migrate.rollback( )
      if ( testServer )
        testServer.close()
    } )

    it( 'should create a server invite', async() => {

      const res = await sendRequest( testToken, {
        query: 'mutation inviteToServer($input: ServerInviteCreateInput!) { serverInviteCreate( input: $input ) }',
        variables: { input: { email: 'cabbages@speckle.systems', message: 'wow!' } }
      } )

      expect( res.body.errors ).to.not.exist
      expect( res.body.data.serverInviteCreate ).to.equal( true )
    } )

    it( 'should create a stream invite', async() => {

      let stream = { name: 'test', description:'wow' }
      stream.id = await createStream( { ...stream, ownerId: actor.id } )

      const res = await sendRequest( testToken, {
        query: 'mutation inviteToStream($input: StreamInviteCreateInput!) { streamInviteCreate( input: $input ) }',
        variables: { input: { email: 'peppers@speckle.systems', message: 'wow!', streamId: stream.id } }
      } )

      expect( res.body.errors ).to.not.exist
      expect( res.body.data.streamInviteCreate ).to.equal( true )
    } )

  } )
} )

function sendRequest( auth, obj, address = serverAddress ) {

  return chai.request( address ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )

}
