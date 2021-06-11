/* istanbul ignore file */
const crs = require( 'crypto-random-string' )
const chai = require( 'chai' )
const request = require( 'supertest' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )
const { async } = require( 'crypto-random-string' )
const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect

const knex = require( `${appRoot}/db/knex` )
const { createUser } = require( `${appRoot}/modules/core/services/users` )

const { createAndSendInvite, getInviteById, getInviteByEmail, validateInvite, useInvite, sanitizeMessage } = require( `${appRoot}/modules/serverinvites/services` )
const { createStream, getStream, getStreamUsers, getUserStreams } = require( `${appRoot}/modules/core/services/streams` )
const { createPersonalAccessToken } = require( `${appRoot}/modules/core/services/tokens` )

const serverAddress = 'http://localhost:3300'

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
      } catch ( e ) {
        return
      }
      assert.fail( 'should not allow multiple invites for the same email' )
    } )

    it( 'should not allow self invites', async() => {

      try {
        await createAndSendInvite( { email: 'didimitrie-100@gmail.com', inviterId: actor.id } )
      } catch ( e ) {
        return
      }
      assert.fail( 'should not allow self invites' )
    } )

    it( 'should not allow invites from no user', async() => {

      try {
        await createAndSendInvite( { email: 'didimitrie233-100@gmail.com', inviterId: 'fake' } )
      } catch ( e ) {
        return
      }
      assert.fail( 'should not allow invites from no user' )
    } )

    it( 'should not allow invites with a too long message', async() => {

      try {
        let inviteId = await createAndSendInvite( {
          email: '123456@gmail.com',
          inviterId: actor.id,
          message: longInviteMessage
        } )
      } catch ( e ){
        return
      }

      assert.fail( 'created invite with too long message' )
    } )

    it( 'should sanitize invite messages', async() => {
      let clean = sanitizeMessage( 'Click on my <b><a href="https://spam.com">spam link please</a></b>!' )
      const includesLink = clean.includes( '<a' )
      expect( includesLink ).to.be.false
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

  // TODO: reinstate these tests; not sure why they pass locally and fail on CI
  describe( 'API @server-invites-api', () => {
    let actor = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie-10000@gmail.com',
      password: 'wtfwtfwtf'
    }

    let testServer, testToken

    before( async() => {
      await knex.migrate.rollback( )
      await knex.migrate.latest( )

      let { app } = await init()

      let { server } = await startHttp( myApp, 3300 )
      testServer = server

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

const longInviteMessage =
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.'
