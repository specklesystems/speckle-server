/* istanbul ignore file */
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init } = require( `${appRoot}/app` )

const expect = chai.expect

chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser, findOrCreateUser, getUser, getUserByEmail, getUsers, searchUsers, countUsers, updateUser, deleteUser, validatePasssword, updateUserPassword, getUserRole, unmakeUserAdmin, makeUserAdmin } = require( '../services/users' )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../services/tokens' )
const { grantPermissionsStream, createStream, getStream } = require( '../services/streams' )

const {
  createBranch,
  getBranchesByStreamId
} = require( '../services/branches' )

const {
  createCommitByBranchName,
  getCommitsByBranchName,
  getCommitById,
  getCommitsByStreamId,
  deleteCommit,
} = require( '../services/commits' )

const { createObject, createObjects } = require( '../services/objects' )

describe( 'Actors & Tokens @user-services', () => {
  let myTestActor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let otherUser = {}

  before( async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
    await init()

    let actorId = await createUser( myTestActor )
    myTestActor.id = actorId
  } )

  after( async () => {
    await knex.migrate.rollback()
  } )


  describe( 'Users @core-users', () => {
    it( 'Should create an user', async () => {
      let newUser = { ...myTestActor }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.password = 'testthebest'

      let actorId = await createUser( newUser )
      newUser.id = actorId
      otherUser = { ...newUser }

      expect( actorId ).to.be.a( 'string' )
    } )

    it( 'Should store user email lowercase', async () => {
      let user = { name: 'Marty McFly', email: 'Marty@Mc.Fly', password: 'something_future_proof' }

      let userId = await createUser( user )

      let storedUser = await getUser( userId )
      expect( storedUser.email ).to.equal( user.email.toLowerCase() )
    } )

    it( 'Get user by should ignore email casing', async () => {
      let user = await getUserByEmail( { email: 'BiLL@GaTES.cOm' } )
      expect( user.email ).to.equal( 'bill@gates.com' )
    } )

    it( 'Validate password should ignore email casing', async () => {
      expect( await validatePasssword( { email: 'BiLL@GaTES.cOm', password: 'testthebest' } ) )
    } )

    it( 'Should not create a user with a too small password', async () => {
      try {
        await createUser( { name: 'Dim Sum', email: 'dim@gmail.com', password: '1234567' } )
      } catch ( e ) {
        return
      }
      assert.fail( 'short pwd' )
    } )

    it ( 'Should still find previously stored non lowercase emails', async ( ) => {
      const email = 'Dim@gMail.cOm'
      const user =  { name: 'Dim Sum', email, password: '1234567' } 
      user.id = crs( { length: 10 } )
      user.passwordDigest = await bcrypt.hash( user.password, 10 )
      delete user.password

      const [ { id: userId } ] = await knex( 'users' ).returning( 'id' ).insert( user )

      const userByEmail = await getUserByEmail( { email } )
      expect( userByEmail ).to.not.be.null
      expect( userByEmail.email ).to.equal( email )
      expect( userByEmail.id ).to.equal( userId )

      const userByLowerEmail = await getUserByEmail( { email: email.toLowerCase() } )
      expect( userByLowerEmail ).to.not.be.null
      expect( userByLowerEmail.email ).to.equal( email )
      expect( user.id ).to.equal( userId )

      user.email = user.email.toLowerCase()
      const foundNotCreatedUser = await findOrCreateUser( { user } )
      expect( foundNotCreatedUser.id ).to.equal( userId )
    } )

    it( 'Should not create an user with the same email', async () => {
      let newUser = {}
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

    it( 'Find or create should create a user', async () => {
      let newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'

      let { id } = await findOrCreateUser( { user: newUser } )
      ballmerUserId = id
      expect( id ).to.be.a( 'string' )
    } )

    it( 'Find or create should NOT create a user', async () => {
      let newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'
      newUser.suuid = 'really it does not matter'

      let { id } = await findOrCreateUser( { user: newUser } )
      expect( id ).to.equal( ballmerUserId )
    } )

    // Note: deletion is more complicated. 
    it( 'Should delete a user', async () => {
      let soloOwnerStream = { name: 'Test Stream 01', description: 'wonderful test stream', isPublic: true }
      let multiOwnerStream = { name: 'Test Stream 02', description: 'another test stream', isPublic: true }

      soloOwnerStream.id = await createStream( { ...soloOwnerStream, ownerId: ballmerUserId } )
      multiOwnerStream.id = await createStream( { ...multiOwnerStream, ownerId: ballmerUserId } )

      await grantPermissionsStream( { streamId: multiOwnerStream.id, userId: myTestActor.id, role: 'stream:owner' } )

      // create a branch for ballmer on the multiowner stream
      let branch = { name: 'ballmer/dev' }
      branch.id = await createBranch( { ...branch, streamId: multiOwnerStream.id, authorId: ballmerUserId } )

      let branchSecond = { name: 'steve/jobs' }
      branchSecond.id = await createBranch( { ...branchSecond, streamId: multiOwnerStream.id, authorId: myTestActor.id } )

      // create an object and a commit around it on the multiowner stream
      let objId = await createObject( multiOwnerStream.id, { pie: 'in the sky' } )
      let commitId = await createCommitByBranchName( { streamId: multiOwnerStream.id, branchName: 'ballmer/dev', message: 'breakfast commit', sourceApplication: 'tests', objectId: objId, authorId: ballmerUserId } )

      await deleteUser( ballmerUserId )

      if ( await getStream( { streamId: soloOwnerStream.id } ) !== undefined ) {
        assert.fail( 'user stream not deleted' )
      }

      let multiOwnerStreamCopy = await getStream( { streamId: multiOwnerStream.id } )
      if ( !multiOwnerStreamCopy || multiOwnerStreamCopy.id != multiOwnerStream.id ) {
        assert.fail( 'shared stream deleted' )
      }

      let branches = await getBranchesByStreamId( { streamId: multiOwnerStream.id } )
      expect( branches.items.length ).to.equal( 3 )

      let branchCommits = await getCommitsByBranchName( { streamId: multiOwnerStream.id, branchName: 'ballmer/dev' } )
      expect( branchCommits.commits.length ).to.equal( 1 )

      let commit = await getCommitById( { streamId: multiOwnerStream.id, id: commitId } )
      expect( commit ).to.be.not.null

      let commitsByStreamId = await getCommitsByStreamId( { streamId: multiOwnerStream.id } )
      expect( commitsByStreamId.commits.length ).to.equal( 1 )

      let user = await getUser( ballmerUserId )
      if ( user )
        assert.fail( 'user not deleted' )
    } )

    it( 'Should not delete the last admin user', async () => {
      try {
        await deleteUser( myTestActor.id )
        assert.fail( 'boom' )
      } catch ( err ) {
        expect( err.message ).to.equal( 'Cannot remove the last admin role from the server' )
      }
    } )

    it( 'Should get a user', async () => {
      let actor = await getUser( myTestActor.id )
      expect( actor ).to.not.have.property( 'passwordDigest' )
    } )

    it( 'Should search and get users', async () => {
      let { users } = await searchUsers( 'gates', 20, null )
      expect( users ).to.have.lengthOf( 1 )
      expect( users[0].name ).to.equal( 'Bill Gates' )
    } )

    it( 'Should update a user', async () => {
      let updatedActor = { ...myTestActor }
      updatedActor.name = 'didimitrie'

      await updateUser( myTestActor.id, updatedActor )

      let actor = await getUser( myTestActor.id )
      expect( actor.name ).to.equal( updatedActor.name )
    } )

    it( 'Should not update password', async () => {
      let updatedActor = { ...myTestActor }
      updatedActor.password = 'failwhale'

      await updateUser( myTestActor.id, updatedActor )

      let match = await validatePasssword( { email: myTestActor.email, password: 'failwhale' } )
      expect( match ).to.equal( false )
    } )

    it( 'Should validate user password', async () => {
      let actor = {}
      actor.password = 'super-test-200'
      actor.email = 'e@ma.il'
      actor.name = 'Bob Gates'

      let id = await createUser( actor )

      let match = await validatePasssword( { email: actor.email, password: 'super-test-200' } )
      expect( match ).to.equal( true )
      let matchWrong = await validatePasssword( { email: actor.email, password: 'super-test-2000' } )
      expect( matchWrong ).to.equal( false )
    } )

    it( 'Should update the password of a user', async () => {
      let id = await createUser( { name: 'D', email: 'tester@mcbester.com', password: 'H4!b5at+kWls-8yh4Guq' } ) // https://mostsecure.pw
      await updateUserPassword( { id, newPassword: 'Hello Dogs and Cats' } )

      let match = await validatePasssword( { email: 'tester@mcbester.com', password: 'Hello Dogs and Cats' } )
      expect( match ).to.equal( true )
    } )
  } )

  describe( 'API Tokens @core-apitokens', () => {
    let myFirstToken
    let pregeneratedToken
    let revokedToken
    let expireSoonToken

    before( async () => {
      pregeneratedToken = await createPersonalAccessToken( myTestActor.id, 'Whabadub', [ 'streams:read', 'streams:write', 'profile:read', 'users:email' ] )
      revokedToken = await createPersonalAccessToken( myTestActor.id, 'Mr. Revoked', [ 'streams:read' ] )
      expireSoonToken = await createPersonalAccessToken( myTestActor.id, 'Mayfly', [ 'streams:read' ], 1 ) // 1ms lifespan
    } )

    it( 'Should create a personal api token', async () => {
      let scopes = [ 'streams:write', 'profile:read' ]
      let name = 'My Test Token'

      myFirstToken = await createPersonalAccessToken( myTestActor.id, name, scopes )
      expect( myFirstToken ).to.have.lengthOf( 42 )
    } )

    // it( 'Should create an api token for an app', async ( ) => {
    //   let test = await createAppToken( { userId: myTestActor.id, appId: 'spklwebapp' } )
    //   expect( test ).to.have.lengthOf( 42 )
    // } )

    it( 'Should validate a token', async () => {
      let res = await validateToken( pregeneratedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( true )
      expect( res ).to.have.property( 'scopes' )
      expect( res ).to.have.property( 'userId' )
      expect( res ).to.have.property( 'role' )
    } )

    it( 'Should revoke an api token', async () => {
      await revokeToken( revokedToken, myTestActor.id )
      let res = await validateToken( revokedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( false )
    } )

    it( 'Should refuse an expired token', async () => {
      let res = await validateToken( expireSoonToken )
      expect( res.valid ).to.equal( false )
      // assert.fail( )
    } )

    it( 'Should get the tokens of an user', async () => {
      let userTokens = await getUserTokens( myTestActor.id )
      expect( userTokens ).to.be.an( 'array' )
      expect( userTokens ).to.have.lengthOf( 2 )
    } )
  } )
} )


describe( 'User admin @user-services', () => {
  let myTestActor = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m'
  }

  before( async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
    await init()

    let actorId = await createUser( myTestActor )
    myTestActor.id = actorId
  } )

  after( async () => {
    await knex.migrate.rollback()
  } )

  it( 'First created user should be admin', async () => {
    let users = await getUsers( 100, 0 )
    expect( users ).to.be.an( 'array' )
    expect( users ).to.have.lengthOf( 1 )
    let firstUser = users[0]

    let userRole = await getUserRole( firstUser.id )
    expect( userRole ).to.equal( 'server:admin' )
  } )

  it( 'Count user knows how to count', async () => {
    expect( await countUsers() ).to.equal( 1 )
    let newUser = { ...myTestActor }
    newUser.name = 'Bill Gates'
    newUser.email = 'bill@gates.com'
    newUser.password = 'testthebest'

    let actorId = await createUser( newUser )

    expect( await countUsers() ).to.equal( 2 )

    await deleteUser( actorId )
    expect( await countUsers() ).to.equal( 1 )
  } )

  it( 'Get users query limit is sanitized to upper limit', async () => {
    let createNewDroid = ( number ) => {
      return {
        name: `${number}`,
        email: `${number}@droidarmy.com`,
        password: 'sn3aky-1337-b1m'
      }
    }

    let userInputs = Array( 250 ).fill().map( ( v, i ) => createNewDroid( i ) )

    expect( await countUsers() ).to.equal( 1 )

    await Promise.all( userInputs.map( userInput => createUser( userInput ) ) )
    expect( await countUsers() ).to.equal( 251 )

    let users = await getUsers( 2000000 )
    expect( users ).to.have.lengthOf( 200 )
  } )

  it( 'Get users offset is applied', async () => {
    let users = await getUsers( 200, 200 )
    expect( users ).to.have.lengthOf( 51 )
  } )

  it( 'User query filters', async () => {
    let users = await getUsers( 100, 0, 'gergo' )
    expect( users ).to.have.lengthOf( 1 )
    let [ user ] = users
    expect( user.email ).to.equal( 'gergo@jedlicska.com' )
  } )

  it( 'Count users applies query', async () => {
    expect( await countUsers( 'droid' ) ).to.equal( 250 )
  } )

  it( 'Change user role modifies role', async () => {
    let [ user ] = await getUsers( 1, 10 )

    let oldRole = await getUserRole( user.id )
    expect( oldRole ).to.equal( 'server:user' )

    await makeUserAdmin( { userId: user.id } )
    let newRole = await getUserRole( user.id )
    expect( newRole ).to.equal( 'server:admin' )

    await unmakeUserAdmin( { userId: user.id } )
    newRole = await getUserRole( user.id )
    expect( newRole ).to.equal( 'server:user' )
  } )

  it( 'Ensure at least one admin remains in the server', async () => {
    try {
      await unmakeUserAdmin( { userId: myTestActor.id, role: 'server:admin' } )
      assert.fail( 'This should have failed' )
    } catch ( err ) {
      expect( err.message ).to.equal( 'Cannot remove the last admin role from the server' )
    }
  } )
} )
