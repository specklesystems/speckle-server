/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser, findOrCreateUser, getUser, searchUsers, updateUser, deleteUser, validatePasssword, updateUserPassword } = require( '../services/users' )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../services/tokens' )
const { grantPermissionsStream, createStream, getStream } = require( '../services/streams' )

describe( 'Actors & Tokens @user-services', ( ) => {
  let myTestActor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let otherUser = {}

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    await init()

    let actorId = await createUser( myTestActor )
    myTestActor.id = actorId

  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )


  describe( 'Users @core-users', ( ) => {

    it( 'First created user should be a server admin', async ( ) => {

    } )

    it( 'Should create an user', async ( ) => {
      let newUser = { ...myTestActor }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.password = 'testthebest'

      let actorId = await createUser( newUser )
      newUser.id = actorId
      otherUser = { ...newUser }

      expect( actorId ).to.be.a( 'string' )
    } )

    it( 'Should not create a user with a too small password', async () => {
      try {
        await createUser( { name: 'Dim Sum', email: 'dim@gmail.com', password: '1234567' } )
      } catch ( e ) {
        return
      }
      assert.fail( 'short pwd' )
    } )

    it( 'Should not create an user with the same email', async ( ) => {

      let newUser = { }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.password = 'testthebest'

      try {
        let actorId = await createUser( newUser )
      } catch ( e ) {
        return
      }
      assert.fail( 'dupe email' )
    } )

    let ballmerUserId = null

    it( 'Find or create should create a user', async ( ) => {

      let newUser = { }
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'

      let { id } = await findOrCreateUser( { user: newUser } )
      ballmerUserId = id
      expect( id ).to.be.a( 'string' )

    } )

    it( 'Find or create should NOT create a user', async ( ) => {

      let newUser = { }
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'
      newUser.suuid = 'really it does not matter'

      let { id } = await findOrCreateUser( { user: newUser } )
      expect( id ).to.equal( ballmerUserId )

    } )

    it( 'Should delete a user', async ( ) => {
      let soloOwnerStream = { name: 'Test Stream 01', description: 'wonderful test stream', isPublic: true }
      let multiOwnerStream = { name: 'Test Stream 02', description: 'another test stream', isPublic: true }
      soloOwnerStream.id = await createStream( { ...soloOwnerStream, ownerId: ballmerUserId } )
      multiOwnerStream.id = await createStream( { ...multiOwnerStream, ownerId: ballmerUserId } )
      await grantPermissionsStream( { streamId: multiOwnerStream.id, userId: myTestActor.id, role: 'stream:owner' } )
      
      await deleteUser( ballmerUserId )

      if ( await getStream( { streamId: soloOwnerStream.id } ) !== undefined ) {
        assert.fail( 'user stream not deleted' )
      }
      let multiOwnerStreamCopy = await getStream( { streamId: multiOwnerStream.id } )
      if ( !multiOwnerStreamCopy || multiOwnerStreamCopy.id != multiOwnerStream.id ) {
        assert.fail( 'shared stream deleted' )
      }

      try {
        let user = await getUser( ballmerUserId )
      } catch ( e ) {
        return
      }
      assert.fail( 'user not deleted' )
    } )

    it( 'Should get a user', async ( ) => {
      let actor = await getUser( myTestActor.id )
      expect( actor ).to.not.have.property( 'passwordDigest' )
    } )

    it( 'Should search and get users', async ( ) => {
      let { users } = await searchUsers( 'gates', 20, null )
      expect( users ).to.have.lengthOf( 1 )
      expect( users[ 0 ].name ).to.equal( 'Bill Gates' )
    } )

    it( 'Should update a user', async ( ) => {
      let updatedActor = { ...myTestActor }
      updatedActor.name = 'didimitrie'

      await updateUser( myTestActor.id, updatedActor )

      let actor = await getUser( myTestActor.id )
      expect( actor.name ).to.equal( updatedActor.name )

    } )

    it( 'Should not update password', async ( ) => {
      let updatedActor = { ...myTestActor }
      updatedActor.password = 'failwhale'

      await updateUser( myTestActor.id, updatedActor )

      let match = await validatePasssword( { email: myTestActor.email, password: 'failwhale' } )
      expect( match ).to.equal( false )
    } )

    it( 'Should validate user password', async ( ) => {
      let actor = {}
      actor.password = 'super-test-200'
      actor.email = 'e@ma.il'
      actor.name = 'Bob Gates'

      let id = await createUser( actor )

      let match = await validatePasssword( { email: actor.email, password: 'super-test-200' } )
      expect( match ).to.equal( true )
      let match_wrong = await validatePasssword( { email: actor.email, password: 'super-test-2000' } )
      expect( match_wrong ).to.equal( false )

    } )

    it( 'Should update the password of a user', async() => {
      let id = await createUser( { name: 'D', email:'tester@mcbester.com', password:'H4!b5at+kWls-8yh4Guq' } ) // https://mostsecure.pw
      await updateUserPassword( { id, newPassword: 'Hello Dogs and Cats' } )

      let match = await validatePasssword( { email: 'tester@mcbester.com', password: 'Hello Dogs and Cats' } )
      expect( match ).to.equal( true )
    } )
  } )

  describe( 'API Tokens @core-apitokens', ( ) => {
    let myFirstToken
    let pregeneratedToken
    let revokedToken
    let someOtherToken
    let expireSoonToken

    before( async ( ) => {
      pregeneratedToken = await createPersonalAccessToken( myTestActor.id, 'Whabadub', [ 'streams:read', 'streams:write', 'profile:read', 'users:email' ] )
      revokedToken = await createPersonalAccessToken( myTestActor.id, 'Mr. Revoked', [ 'streams:read' ] )
      someOtherToken = await createPersonalAccessToken( otherUser.id, 'Hello World', [ 'streams:write' ] )
      expireSoonToken = await createPersonalAccessToken( myTestActor.id, 'Mayfly', [ 'streams:read' ], 1 ) // 1ms lifespan
    } )

    it( 'Should create an personal api token', async ( ) => {
      let scopes = [ 'streams:write', 'profile:read' ]
      let name = 'My Test Token'

      myFirstToken = await createPersonalAccessToken( myTestActor.id, name, scopes )
      expect( myFirstToken ).to.have.lengthOf( 42 )
    } )

    // it( 'Should create an api token for an app', async ( ) => {
    //   let test = await createAppToken( { userId: myTestActor.id, appId: 'spklwebapp' } )
    //   expect( test ).to.have.lengthOf( 42 )
    // } )

    it( 'Should validate a token', async ( ) => {
      let res = await validateToken( pregeneratedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( true )
      expect( res ).to.have.property( 'scopes' )
      expect( res ).to.have.property( 'userId' )
      expect( res ).to.have.property( 'role' )
    } )

    it( 'Should revoke an api token', async ( ) => {
      await revokeToken( revokedToken, myTestActor.id )
      let res = await validateToken( revokedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( false )
    } )

    it( 'Should refuse an expired token', async ( ) => {
      let res = await validateToken( expireSoonToken )
      expect( res.valid ).to.equal( false )
      // assert.fail( )
    } )

    it( 'Should get the tokens of an user', async ( ) => {
      let userTokens = await getUserTokens( myTestActor.id )
      expect( userTokens ).to.be.an( 'array' )
      expect( userTokens ).to.have.lengthOf( 2 )
    } )
  } )


} )
