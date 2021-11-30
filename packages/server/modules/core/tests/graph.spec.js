/* istanbul ignore file */
const crypto = require( 'crypto' )
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser, deleteUser, getUsers, archiveUser, makeUserAdmin } = require( '../services/users' )
const { createPersonalAccessToken } = require( '../services/tokens' )
const { createObject, createObjects } = require( '../services/objects' )

let addr
let wsAddr
let expressApp

describe( 'GraphQL API Core @core-api', ( ) => {
  let userA = { name: 'd1', email: 'd.1@speckle.systems', password: 'wowwowwowwowwow' }
  let userB = { name: 'd2', email: 'd.2@speckle.systems', password: 'wowwowwowwowwow' }
  let userC = { name: 'd3', email: 'd.3@speckle.systems', password: 'wowwowwowwowwow' }
  let testServer

  // set up app & two basic users to ping pong permissions around
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    let { app } = await init( )
    expressApp = app
    let { server } = await startHttp( app, 0 )
    app.on( 'appStarted', () => {
      addr    = `http://localhost:${server.address().port}`
      wsAddr = `ws://localhost:${server.address().port}`
    } )
    testServer = server

    userA.id = await createUser( userA )
    userA.token = `Bearer ${( await createPersonalAccessToken( userA.id, 'test token user A', [ 'server:setup', 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
    userB.id = await createUser( userB )
    userB.token = `Bearer ${( await createPersonalAccessToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
    userC.id = await createUser( userC )
    userC.token = `Bearer ${( await createPersonalAccessToken( userC.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
    testServer.close( )
  } )

  // the stream ids
  let ts1
  let ts2
  let ts3
  let ts4
  let ts5
  let ts6

  // some api tokens
  let token1
  let token2
  let token3

  // object ids
  let objIds

  // some commits
  let c1 = {}
  let c2 = {}

  // some branches
  let b1 = {}
  let b2 = {}
  let b3 = {}
  let b4 = {}

  describe( 'Mutations', ( ) => {
    describe( 'Users & Api tokens', ( ) => {
      it( 'Should create some api tokens', async ( ) => {
        const res1 = await sendRequest( userA.token, { query: 'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:read", "users:read", "tokens:read"]}) }' } )
        expect( res1 ).to.be.json
        expect( res1.body.errors ).to.not.exist
        expect( res1.body.data.apiTokenCreate ).to.be.a( 'string' )

        token1 = `Bearer ${res1.body.data.apiTokenCreate}`
        const res2 = await sendRequest( userA.token, { query: 'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }' } )
        token2 = `Bearer ${res2.body.data.apiTokenCreate}`

        const res3 = await sendRequest( userB.token, { query: 'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }' } )
        token3 = `Bearer ${res3.body.data.apiTokenCreate}`
      } )

      it( 'Should revoke an api token that the user owns', async ( ) => {
        const res = await sendRequest( userA.token, { query: `mutation{ apiTokenRevoke(token:"${token2}")}` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.apiTokenRevoke ).to.equal( true )
      } )

      it( 'Should fail to revoke an api token that I do not own', async ( ) => {
        const res = await sendRequest( userA.token, { query: `mutation{ apiTokenRevoke(token:"${token3}")}` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it( 'Should fail to create a stream with an invalid scope token', async ( ) => {
        // Note: token1 has only stream read access
        const res = await sendRequest( token1, { query: 'mutation { streamCreate(stream: { name: "INVALID TS1 (u A) Private", description: "Hello World", isPublic:false } ) }' } )
        expect( res.body.errors ).to.exist
      } )

      it( 'Should edit my profile', async ( ) => {
        const res = await sendRequest( userA.token, { query: 'mutation($user:UserUpdateInput!) { userUpdate( user: $user) } ', variables: { user: { name: 'Miticå', bio: 'He never really knows what he is doing.' } } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.userUpdate ).to.equal( true )
      } )

      it( 'Should delete my account', async ( ) => {
        let userDelete = { name: 'delete', email: 'delete@speckle.systems', password: 'wowwowwowwowwow' }
        userDelete.id = await createUser( userDelete )

        userDelete.token = `Bearer ${( await createPersonalAccessToken( userDelete.id, 'fail token user del', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`

        let badTokenScopesBadEmail = await sendRequest( userDelete.token, { query: 'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ', variables: { user: { email: 'wrongEmail@email.com' } } } )
        expect( badTokenScopesBadEmail.body.errors ).to.exist
        let badTokenScopesGoodEmail = await sendRequest( userDelete.token, { query: 'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ', variables: { user: { email: userDelete.email } } } )
        expect( badTokenScopesGoodEmail.body.errors ).to.exist

        userDelete.token = `Bearer ${( await createPersonalAccessToken( userDelete.id, 'test token user del', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email', 'profile:delete' ] ) )}`

        let goodTokenScopesBadEmail = await sendRequest( userDelete.token, { query: 'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ', variables: { user: { email: 'wrongEmail@email.com' } } } )
        expect( goodTokenScopesBadEmail.body.errors ).to.exist
        let goodTokenScopesGoodEmail = await sendRequest( userDelete.token, { query: 'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ', variables: { user: { email: userDelete.email } } } )
        expect( goodTokenScopesGoodEmail.body.errors ).to.not.exist
      } )
    } )

    describe ( 'User role change', () => {
      it ( 'User role is changed', async () => {
        let queriedUserB = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email role } }` } )
        expect( queriedUserB.body.data.user.role ).to.equal( 'server:user' )
        let query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "server:admin"})}`
        await sendRequest( userA.token, { query } )
        queriedUserB = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email role } }` } )
        expect( queriedUserB.body.data.user.role ).to.equal( 'server:admin' )
        expect( queriedUserB.body.data )
        query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "server:user"})}`
        await sendRequest( userA.token, { query } )
        queriedUserB = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email role } }` } )
        expect( queriedUserB.body.data.user.role ).to.equal( 'server:user' )
      } )

      it ( 'Only admins can change user role', async () => {
        let query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "server:admin"})}`
        let res = await sendRequest( userB.token, { query } )
        let queriedUserB = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email role } }` } )
        expect( res.body.errors ).to.exist
        expect( queriedUserB.body.data.user.role ).to.equal( 'server:user' )
      } )
    } )

    describe( 'User deletion', ( ) => {
      it ( 'Only admins can delete user', async () => {
        let userDelete = { name: 'delete', email: 'delete@speckle.systems', password: 'wowwowwowwowwow' }
        userDelete.id = await createUser( userDelete )

        let users = await getUsers()
        expect( users.map( u => u.id ) ).to.contain( userDelete.id )
        let query = `mutation { adminDeleteUser( userConfirmation: { email: "${userDelete.email}" } ) } `
        let res = await sendRequest( userB.token, { query } )
        expect( res.body.errors ).to.exist
        expect ( res.body.errors[0].extensions.code ).to.equal( 'FORBIDDEN' )
      } )

      it ( 'Admin can delete user', async () => {
        let userDelete = { name: 'delete', email: 'd3l3t3@speckle.systems', password: 'wowwowwowwowwow' }
        userDelete.id = await createUser( userDelete )

        let users = await getUsers()
        expect( users.map( u => u.id ) ).to.contain( userDelete.id )
        let query = `mutation { adminDeleteUser( userConfirmation: { email: "${userDelete.email}" } ) } `
        let deleteResult = await sendRequest( userA.token, { query } )
        expect( deleteResult.body.data.adminDeleteUser ).to.equal( true )
        users = await getUsers()
        expect( users.map( u => u.id ) ).to.not.contain( userDelete.id )
      } )

      it ( 'Cannot delete the last admin', async () => {
        let query = `mutation { adminDeleteUser( userConfirmation: { email: "${userA.email}" } ) } `
        let res = await sendRequest( userA.token, { query } )
        expect( res.body.errors ).to.exist
        expect ( res.body.errors[0].message ).to.equal( 'Cannot remove the last admin role from the server' )
      } )
    } )
    describe( 'Streams', ( ) => {
      it( 'Should create some streams', async ( ) => {
        const resS1 = await sendRequest( userA.token, { query: 'mutation { streamCreate(stream: { name: "TS1 (u A) Private", description: "Hello World", isPublic:false } ) }' } )
        expect( resS1 ).to.be.json
        expect( resS1.body.errors ).to.not.exist
        expect( resS1.body.data ).to.have.property( 'streamCreate' )
        expect( resS1.body.data.streamCreate ).to.be.a( 'string' )
        ts1 = resS1.body.data.streamCreate

        const resS2 = await sendRequest( userA.token, { query: 'mutation { streamCreate(stream: { name: "TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }' } )
        ts2 = resS2.body.data.streamCreate

        const resS3 = await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }' } )
        ts3 = resS3.body.data.streamCreate

        const resS4 = await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "TS4 (u B)", description: "Hello Julian", isPublic:true } ) }' } )
        ts4 = resS4.body.data.streamCreate

        const resS5 = await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "TS5 (u B)", description: "Hello King", isPublic:true } ) }' } )
        ts5 = resS5.body.data.streamCreate
      } )

      it( 'Should update a stream', async ( ) => {
        const resS1 = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: {id:"${ts1}" name: "TS1 (u A) Private UPDATED", description: "Hello World, Again!", isPublic:false } ) }` } )

        expect( resS1 ).to.be.json
        expect( resS1.body.errors ).to.not.exist
        expect( resS1.body.data ).to.have.property( 'streamUpdate' )
        expect( resS1.body.data.streamUpdate ).to.equal( true )
      } )

      it( 'Should grant some permissions', async ( ) => {
        const res = await sendRequest( userA.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts1}", userId: "${userB.id}" role: "stream:owner"}) }`
        } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.streamGrantPermission ).to.equal( true )

        const res2 = await sendRequest( userB.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts5}", userId: "${userA.id}" role: "stream:owner"}) }`
        } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist

        const res3 = await sendRequest( userB.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts3}", userId: "${userC.id}" role: "stream:owner"}) }`
        } )
        expect( res3 ).to.be.json
        expect( res3.body.errors ).to.not.exist
      } )

      it( 'Should fail to grant permissions if not owner', async ( ) => {
        const res = await sendRequest( userB.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts1}", userId: "${userB.id}" role: "stream:owner"}) }`
        } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it( 'Should fail to grant myself permissions', async ( ) => {
        const res = await sendRequest( userA.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts1}", userId: "${userA.id}" role: "stream:owner"}) }`
        } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it( 'Should not revoke my own permissions', async() => {
        const res = await sendRequest( userA.token, {
          query: `mutation{ streamRevokePermission( permissionParams: {streamId: "${ts1}", userId: "${userA.id}" }) }`
        } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it( 'Should update permissions', async ( ) => {
        const res = await sendRequest( userA.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts1}", userId: "${userB.id}" role: "stream:contributor"}) }`
        } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.streamGrantPermission ).to.equal( true )
      } )

      it( 'Should revoke permissions', async ( ) => {
        // first test if we can get it
        const res = await sendRequest( userC.token, { query: `query { stream(id:"${ts3}") { id name } }` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.name ).to.equal( 'TS3 (u B) Private' )

        const revokeRes = await sendRequest( userB.token, {
          query: `mutation { streamRevokePermission( permissionParams: {streamId: "${ts3}", userId:"${userC.id}"} ) }`
        } )
        expect( revokeRes ).to.be.json
        expect( revokeRes.body.errors ).to.not.exist
        expect( revokeRes.body.data.streamRevokePermission ).to.equal( true )

        const resNotAuth = await sendRequest( userC.token, { query: `query { stream(id:"${ts3}") { id name role } }` } )
        expect( resNotAuth ).to.be.json
        expect( resNotAuth.body.errors ).to.exist
      } )

      it( 'Should fail to edit/write on a public stream if no access is provided', async ( ) => {
        // ts4 is a public stream from uesrB
        const res = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: {id:"${ts4}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }` } )
        expect( res.body.errors ).to.exist
      } )

      it( 'Should fail editing a private stream if no access has been granted', async ( ) => {
        const res = await sendRequest( userA.token, { query: `mutation { streamUpdate(stream: {id:"${ts3}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }` } )

        expect( res.body.errors ).to.exist
      } )

      it( 'Should fail to delete a stream because of permissions', async ( ) => {
        const res = await sendRequest( userB.token, { query: `mutation { streamDelete( id:"${ts1}")}` } )
        expect( res ).to.be.json

        expect( res.body.errors ).to.exist
        expect( res.body.errors[ 0 ].extensions.code ).to.equal( 'FORBIDDEN' )
      } )

      it( 'Should fail to delete streams if not admin', async ( ) => {
        const res = await sendRequest( userB.token, { query: `mutation { streamsDelete( ids:"[${ts4}]")}` } )
        expect( res ).to.be.json

        expect( res.body.errors ).to.exist
        expect( res.body.errors[ 0 ].extensions.code ).to.equal( 'FORBIDDEN' )
      } )

      it( 'Should delete a stream', async ( ) => {
        const res = await sendRequest( userB.token, { query: `mutation { streamDelete( id:"${ts4}")}` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'streamDelete' )
        expect( res.body.data.streamDelete ).to.equal( true )
      } )

      it ( 'Should query streams', async ( ) => {
        let streamResults = await sendRequest( userA.token, {
          query: '{ streams(limit: 200) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.errors ).to.exist
        expect( streamResults.body.errors[ 0 ].extensions.code ).to.equal( 'BAD_USER_INPUT' )
      } )

      it ( 'Should be forbidden to query admin streams if not admin', async ( ) => {
        let res = await sendRequest( userC.token, {
          query: '{ adminStreams { totalCount items { id name } } }'
        } )
        expect( res ).to.be.json

        expect( res.body.errors ).to.exist
        expect( res.body.errors[ 0 ].extensions.code ).to.equal( 'FORBIDDEN' )
      } )

      it ( 'Should query admin streams', async ( ) => {
        let streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams { totalCount items { id name } } }'
        } )

        expect( streamResults.body.data.adminStreams.totalCount ).to.equal( 4 )

        await Promise.all( [
          await sendRequest( userC.token, { query: 'mutation { streamCreate(stream: { name: "Admin TS1 (u A) Private", description: "Hello World", isPublic:false } ) }' } ),
          await sendRequest( userA.token, { query: 'mutation { streamCreate(stream: { name: "Admin TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }' } ),
          await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "Admin TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }' } ),
          await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "Admin TS4 (u B)", description: "Hello Julian", isPublic:true } ) }' } ),
          await sendRequest( userB.token, { query: 'mutation { streamCreate(stream: { name: "Admin TS5 (u B)", description: "Hello King", isPublic:true } ) }' } )
        ] )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams { totalCount items { id name } } }'
        } )
        expect( streamResults.body.data.adminStreams.totalCount ).to.equal( 9 )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams(limit: 200) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.errors ).to.exist
        expect( streamResults.body.errors[ 0 ].extensions.code ).to.equal( 'BAD_USER_INPUT' )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams(limit: 2) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.data.adminStreams.totalCount ).to.equal( 9 )
        expect( streamResults.body.data.adminStreams.items.length ).to.equal( 2 )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams(offset: 5) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.data.adminStreams.items.length ).to.equal( 4 )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams( query: "Admin" ) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.data.adminStreams.totalCount ).to.equal( 5 )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams( orderBy: "updatedAt,asc" ) { totalCount items { id name updatedAt } } }'
        } )
        expect( streamResults.body.data.adminStreams.items.pop().name ).to.equal( 'Admin TS5 (u B)' )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams( visibility: "private" ) { totalCount items { id name isPublic } } }'
        } )
        expect( streamResults.body.data.adminStreams.items )
          .to.satisfy( ( streams ) => streams.every( stream => !stream.isPublic ) )

        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams( visibility: "public" ) { totalCount items { id name isPublic } } }'
        } )
        expect( streamResults.body.data.adminStreams.items )
          .to.satisfy( ( streams ) => streams.every( stream => stream.isPublic ) )
      } )

      it( 'Should delete streams', async ( ) => {
        streamResults = await sendRequest( userA.token, {
          query: '{ adminStreams( query: "Admin" ) { totalCount items { id name } } }'
        } )
        expect( streamResults.body.data.adminStreams.totalCount ).to.equal( 5 )
        const streamIds =  streamResults.body.data.adminStreams.items.map( stream => stream.id )
        const res = await sendRequest( userA.token, { query: 'mutation ( $ids: [String!] ){ streamsDelete( ids: $ids )}', variables:{ ids: streamIds } } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'streamsDelete' )
        expect( res.body.data.streamsDelete ).to.equal( true )
      } )
    } )

    describe( 'Objects, Commits & Branches', ( ) => {
      it( 'Should create some objects', async ( ) => {
        let objs = [ ]
        for ( let i = 0; i < 500; i++ ) {
          if ( i % 2 === 0 ) objs.push( { applicationId: i, type: 'Point', x: i, y: 1, z: i * 0.42, extra: { super: true, arr: [ 1, 2, 3, 4 ] } } )
          else if ( i % 3 === 0 ) objs.push( { applicationId: i, type: 'Line', start: { x: i, y: 1, z: i * 0.42 }, end: { x: 0, y: 2, z: i * i }, extra: { super: false, arr: [ 12, 23, 34, 42, { imp: [ 'possible', 'this', 'sturcture', 'is' ] } ] } } )
          else objs.push( { cool: [ 's', 't', [ 'u', 'f', 'f', i ], { that: true } ], iValue: i + i / 3 } )
        }

        const res = await sendRequest( userA.token, { query: `mutation( $objs: [JSONObject]! ) { objectCreate( objectInput: {streamId:"${ts1}", objects: $objs} ) }`, variables: { objs: objs } } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.objectCreate ).to.have.lengthOf( objs.length )

        objIds = res.body.data.objectCreate
      } )

      it( 'Should create several commits', async ( ) => {
        c1.message = 'what a message for a first commit'
        c1.streamId = ts1
        c1.objectId = objIds[ 0 ]
        c1.branchName = 'main'

        let res = await sendRequest( userA.token, { query: 'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }', variables: { myCommit: c1 } } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'commitCreate' )
        expect( res.body.data.commitCreate ).to.be.a( 'string' )
        c1.id = res.body.data.commitCreate

        c2.message = 'what a message for a second commit'
        c2.streamId = ts1
        c2.objectId = objIds[ 1 ]
        c2.branchName = 'main'
        c2.previousCommitIds = [ c1.id ]

        res = await sendRequest( userA.token, { query: 'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }', variables: { myCommit: c2 } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'commitCreate' )
        expect( res.body.data.commitCreate ).to.be.a( 'string' )

        c2.id = res.body.data.commitCreate
      } )

      it( 'Should update a commit', async ( ) => {
        let updatePayload = {
          streamId: ts1,
          id: c1.id,
          message: 'first commit'
        }
        let res = await sendRequest( userA.token, { query: 'mutation( $myCommit: CommitUpdateInput! ) { commitUpdate( commit: $myCommit ) }', variables: { myCommit: updatePayload } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'commitUpdate' )

        let res2 = await sendRequest( userB.token, { query: 'mutation( $myCommit: CommitUpdateInput! ) { commitUpdate( commit: $myCommit ) }', variables: { myCommit: updatePayload } } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.exist
      } )

      it( 'Should create a read receipt', async () => {
        let res = await sendRequest( userA.token, { query: 'mutation($input: CommitReceivedInput!) { commitReceive(input: $input) }' , variables: {
          input: {
            streamId: ts1,
            commitId: c1.id,
            sourceApplication: 'tests',
            message: 'Irrelevant!'
          }
        } 
        } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.commitReceive ).to.equal( true )

        let res3 = await sendRequest( null, { query: 'mutation($input: CommitReceivedInput!) { commitReceive(input: $input) }' , variables: {
          input: {
            streamId: ts1,
            commitId: c1.id,
            sourceApplication: 'tests',
            message: 'Irrelevant!'
          }
        } 
        } )
        
        expect( res3 ).to.be.json
        expect( res3.body.errors ).to.exist
        expect( res3.body.errors[0].extensions.code ).to.equal( 'FORBIDDEN' )
      } )

      it( 'Should delete a commit', async ( ) => {
        let payload = { streamId: ts1, id: c2.id }

        let res = await sendRequest( userB.token, { query: 'mutation( $myCommit: CommitDeleteInput! ) { commitDelete( commit: $myCommit ) }', variables: { myCommit: payload } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist

        let res2 = await sendRequest( userA.token, { query: 'mutation( $myCommit: CommitDeleteInput! ) { commitDelete( commit: $myCommit ) }', variables: { myCommit: payload } } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist
        expect( res2.body.data ).to.have.property( 'commitDelete' )
      } )

      it( 'Should create several branches', async ( ) => {
        b1 = { streamId: ts1, name: 'dim/dev', description: 'dimitries development branch' }

        const res1 = await sendRequest( userA.token, { query: 'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }', variables: { branch: b1 } } )
        expect( res1 ).to.be.json
        expect( res1.body.errors ).to.not.exist
        expect( res1.body.data ).to.have.property( 'branchCreate' )
        expect( res1.body.data.branchCreate ).to.be.a( 'string' )
        b1.id = res1.body.data.branchCreate

        b2 = { streamId: ts1, name: 'dim/dev/api-surgery', description: 'another branch' }

        const res2 = await sendRequest( userB.token, { query: 'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }', variables: { branch: b2 } } )
        expect( res2.body.errors ).to.not.exist
        b2.id = res2.body.data.branchCreate

        b3 = { streamId: ts1, name: 'userB/dev/api', description: 'more branches branch' }
        const res3 = await sendRequest( userB.token, { query: 'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }', variables: { branch: b3 } } )
        expect( res3.body.errors ).to.not.exist
        b3.id = res3.body.data.branchCreate
      } )

      it( 'Should update a branch', async ( ) => {
        let payload = {
          streamId: ts1,
          id: b2.id,
          name: 'userb/whatever/whatever'
        }

        const res1 = await sendRequest( userA.token, { query: 'mutation( $branch:BranchUpdateInput! ) { branchUpdate( branch:$branch ) }', variables: { branch: payload } } )
        expect( res1 ).to.be.json
        expect( res1.body.errors ).to.not.exist
        expect( res1.body.data ).to.have.property( 'branchUpdate' )
        expect( res1.body.data.branchUpdate ).to.equal( true )
      } )

      it( 'Should delete a branch', async ( ) => {
        // give C some access permissions
        const perms = await sendRequest( userA.token, {
          query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${ts1}", userId: "${userC.id}" role: "stream:contributor"}) }`
        } )

        let payload = {
          streamId: ts1,
          id: b2.id
        }

        let badPayload = {
          streamId: ts1,
          id: 'APRIL FOOOLS!'
        }

        const res = await sendRequest( userC.token, { query: 'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }', variables: { branch: badPayload } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
        expect( res.body.errors[ 0 ].message ).to.equal( 'Branch not found.' )

        const res1 = await sendRequest( userC.token, { query: 'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }', variables: { branch: payload } } )
        expect( res1 ).to.be.json
        expect( res1.body.errors ).to.exist
        expect( res1.body.errors[ 0 ].message ).to.equal( 'Only the branch creator or stream owners are allowed to delete branches.' )

        const res2 = await sendRequest( userA.token, { query: 'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }', variables: { branch: payload } } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist

        // revoke perms for c back (dont' wanna mess up our integration-unit tests below)
        await sendRequest( userA.token, { query: `mutation{ streamRevokePermission( permissionParams: {streamId: "${ts1}", userId: "${userC.id}"} ) }` } )
      } )

      it( 'Should commit to a non-main branch as well...', async ( ) => {
        let cc = {}
        cc.message = 'what a message for a second commit'
        cc.streamId = ts1
        cc.objectId = objIds[ 3 ]
        cc.branchName = 'userB/dev/api'

        let res = await sendRequest( userB.token, { query: 'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }', variables: { myCommit: cc } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'commitCreate' )
        expect( res.body.data.commitCreate ).to.be.a( 'string' )
      } )

      it( 'Should *not* update a branch if given the wrong stream id', async () => {
        // create stream for user C
        const res = await sendRequest( userC.token, { query: 'mutation { streamCreate(stream: { name: "TS (u C) private", description: "sup my dudes", isPublic:false } ) }' } )
        ts6 = res.body.data.streamCreate

        // user B creates branch on private stream
        b4 = { streamId: ts3, name: 'izz/secret', description: 'a private branch on a private stream' }
        const res1 = await sendRequest( userB.token, { query: 'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }', variables: { branch: b4 } } )
        expect( res1 ).to.be.json
        expect( res1.body.errors ).to.not.exist
        expect( res1.body.data ).to.have.property( 'branchCreate' )
        expect( res1.body.data.branchCreate ).to.be.a( 'string' )
        b4.id = res1.body.data.branchCreate

        let badPayload = {
          streamId: ts6, // stream user C has access to
          id: b4.id, // branch user C doesn't have access to
          name: 'izz/not-so-secret'
        }

        const res2 = await sendRequest( userC.token, { query: 'mutation( $branch:BranchUpdateInput! ) { branchUpdate( branch:$branch ) }', variables: { branch: badPayload } } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.exist
        expect( res2.body.errors[ 0 ].message ).to.equal( 'The branch id and stream id do not match. Please check your inputs.' )
      } )

      it( 'should *not* delete a branch if given the wrong stream id', async () => {
        let badPayload = {
          streamId: ts6, // stream user C has access to
          id: b4.id, // branch user C doesn't have access to
        }

        const res = await sendRequest( userC.token, { query: 'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }', variables: { branch: badPayload } } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
        expect( res.body.errors[ 0 ].message ).to.equal( 'The branch id and stream id do not match. Please check your inputs.' )
      } )
    } )
  } )

  describe( 'Queries', ( ) => {
    describe( 'My Profile', ( ) => {
      it( 'Should retrieve my profile', async ( ) => {
        const res = await sendRequest( userA.token, { query: '{ user { id name email role apiTokens { id name } } }' } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'user' )
        expect( res.body.data.user.name ).to.equal( 'Miticå' )
        expect( res.body.data.user.email ).to.equal( 'd.1@speckle.systems' )
        expect( res.body.data.user.role ).to.equal( 'server:admin' )
      } )


      it( 'Should retrieve my streams', async ( ) => {
        // add more streams
        await sendRequest(
          userA.token, {
            query: 'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
            variables: { myStream: { name: 'o hai' } }
          } )

        await sendRequest(
          userA.token, {
            query: 'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
            variables: { myStream: { name: 'bai now' } }
          } )

        await sendRequest(
          userA.token, {
            query: 'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
            variables: { myStream: { name: 'one more for the road' } }
          } )

        const res = await sendRequest( userA.token, { query: '{ user { streams( limit: 3 ) { totalCount cursor items { id name } } } }' } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.user.streams.items.length ).to.equal( 3 )


        const res2 = await sendRequest( userA.token, { query: `{ user { streams( limit: 3, cursor: "${res.body.data.user.streams.cursor}" ) { totalCount cursor items { id name } } } }` } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist
        expect( res2.body.data.user.streams.items.length ).to.equal( 3 )

        let streams = res2.body.data.user.streams.items
        let s1 = streams.find( s => s.name === 'TS1 (u A) Private UPDATED' )
        expect( s1 ).to.exist
      } )

      it( 'Should retrieve my commits (across all streams)', async ( ) => {
        for ( let i = 10; i < 20; i++ ) {
          let c1 = {
            message: `what a message for commit number ${i}`,
            streamId: ts1,
            objectId: objIds[ i ],
            branchName: 'main',
          }
          let res = await sendRequest( userA.token, { query: 'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }', variables: { myCommit: c1 } } )
        }

        const res = await sendRequest( userA.token, { query: '{ user { commits( limit: 3 ) { totalCount cursor items { id message referencedObject } } } }' } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.user.commits.totalCount ).to.equal( 11 )
        expect( res.body.data.user.commits.cursor ).to.exist
        expect( res.body.data.user.commits.items.length ).to.equal( 3 )

        const res2 = await sendRequest( userA.token, { query: `{ user { commits( limit: 3, cursor: "${res.body.data.user.commits.cursor}") { totalCount cursor items { id message referencedObject } } } }` } )
        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist
        expect( res2.body.data.user.commits.totalCount ).to.equal( 11 )
        expect( res2.body.data.user.commits.items.length ).to.equal( 3 )
      } )
    } )

    describe( 'Different Users` Profile', ( ) => {
      it( 'Should retrieve a different profile profile', async ( ) => {
        const res = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email } }` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data ).to.have.property( 'user' )
        expect( res.body.data.user.name ).to.equal( 'd2' )
        expect( res.body.data.user.email ).to.equal( 'd.2@speckle.systems' )
      } )

      it( 'Should not retrieve a profile if no auth', async ( ) => {
        const res = await sendRequest( null, { query: '{ user { id name email } }' } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it( 'Should not retrieve user email field if out of scope', async ( ) => {
        // token1 has only users:read scope
        const res = await sendRequest( token1, { query: ` { user(id:"${userB.id}") { id name email } }` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.user.email ).to.be.null
      } )

      it( 'Should only retrieve public streams from a different user profile ', async ( ) => {
        const res = await sendRequest( token1, { query: `query { user( id:"${userB.id}" ) { streams { totalCount items { id name isPublic } } } }` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.user.streams.totalCount ).to.equal( 1 )
      } )

      it( 'Should search for some users', async ( ) => {
        for ( var i = 0; i < 10; i++ ) {
          // create 10 users: 3 bakers and 7 millers
          await createUser( {
            name: `Master ${ i <= 2 ? 'Baker' : 'Miller' } Matteo The ${i}${ i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} of His Name`,
            email: `matteo_${i}@tomato.com`,
            password: `${ i % 2 === 0 ? 'BakerBakerBakerBaker' : 'TomatoTomatoTomatoTomato' }`
          } )
        }

        let query = `
          query search {
            userSearch( query: "miller" ) {
              cursor
              items {
                id
                name
              }
            }
          }
        `

        let res = await sendRequest( userB.token, { query } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.userSearch.items.length ).to.equal( 7 )

        query = `
          query search {
            userSearch( query: "baker" ) {
              cursor
              items {
                id
                name
              }
            }
          }
        `

        res = await sendRequest( userB.token, { query } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.userSearch.items.length ).to.equal( 3 )

        // by email
        query = 'query { userSearch( query: "matteo_2@tomato.com" ) { cursor items { id name } } } '
        res = await sendRequest( userB.token, { query } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.userSearch.items.length ).to.equal( 1 )
      } )

      it( 'Should not search for some users if bad request', async ( ) => {
        const queryLim = 'query { userSearch( query: "mi" ) { cursor items { id name } } } '
        let res = await sendRequest( userB.token, { query: queryLim } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist

        const queryPagination = 'query { userSearch( query: "matteo", limit: 200 ) { cursor items { id name } } } '
        res = await sendRequest( userB.token, { query: queryPagination } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )

      it ( 'Query users', async () => {
        const queryUsers = 'query { users( limit: 2, query: "matteo") {totalCount, items {id name}}}'
        let res = await sendRequest( userA.token, { query: queryUsers } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.users.items.length ).to.equal( 2 )
        expect( res.body.data.users.totalCount ).to.equal( 10 )

        res = await sendRequest( userC.token, { query: queryUsers } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.exist
      } )      
    } )

    describe( 'Streams', ( ) => {
      let retrievedStream

      it( 'Should retrieve a stream', async ( ) => {
        const res = await sendRequest( userA.token, { query: `
          query {
            stream(id:"${ts1}") {
              id
              name
              createdAt
              updatedAt
              collaborators {
                id
                name
                role
              }
            }
          }` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist

        let stream = res.body.data.stream
        retrievedStream = stream

        expect( stream.name ).to.equal( 'TS1 (u A) Private UPDATED' )
        expect( stream.collaborators ).to.have.lengthOf( 2 )
        expect( stream.collaborators[ 0 ].role ).to.equal( 'stream:contributor' )
        expect( stream.collaborators[ 1 ].role ).to.equal( 'stream:owner' )
      } )

      it( 'Should retrieve a public stream even if not authenticated', async ( ) => {
        const query = `query { stream( id: "${ts2}" ) { name createdAt } }`
        const res = await sendRequest( null, { query } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
      } )

      let bees = [ ]
      it( 'should retrieve all stream branches', async ( ) => {
        let query = `
          query{
            stream(id: "${ts1}"){
              branches( limit: 2 ) {
                totalCount
                cursor
                items {
                  id
                  name
                  author {
                    id
                    name
                  }
                }
              }
            }
          }
        `

        let res = await sendRequest( userA.token, { query } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.branches.items.length ).to.equal( 2 )
        expect( res.body.data.stream.branches.totalCount ).to.equal( 3 )
        expect( res.body.data.stream.branches.cursor ).to.exist

        bees = res.body.data.stream.branches.items

        let query2 = `
          query{
            stream(id: "${ts1}"){
              branches( limit: 2, cursor: "${ res.body.data.stream.branches.cursor }" ) {
                totalCount
                cursor
                items {
                  id
                  name
                  author {
                    id
                    name
                  }
                }
              }
            }
          }
        `
        let res2 = await sendRequest( userA.token, { query: query2 } )

        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist
        expect( res2.body.data.stream.branches.items.length ).to.equal( 1 )
        expect( res2.body.data.stream.branches.totalCount ).to.equal( 3 )
      } )

      it( 'should retrieve a stream branch', async ( ) => {
        const res = await sendRequest( userA.token, { query: `query { stream(id:"${ts1}") { branch( name: "${bees[ 1 ].name}" ) { name description } } } ` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.branch.name ).to.equal( 'dim/dev' )
      } )

      it( 'it should retrieve a stream\'s default \'main\' branch if no branch name is specified', async() => {
        const res = await sendRequest( userA.token, { query: `query { stream(id:"${ts1}") { branch { name description } } } ` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.branch.name ).to.equal( 'main' )
      } )

      it( 'should retrieve a branch`s commits', async ( ) => {
        let query = `
        query {
          stream( id: "${ts1}" ) {
            branch( name: "main" ) {
              id
              name
              commits( limit: 5 ) {
                totalCount
                cursor
                items {
                  id
                  message
                  createdAt
                  referencedObject
                  authorId
                }
              }
            }
          }
        }
        `
        const res = await sendRequest( userA.token, { query: query } )
        expect( res.body.data.stream.branch.commits.items.length ).to.equal( 5 )
        expect( res.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'id' )
        expect( res.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'message' )
        expect( res.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'createdAt' )

        let query2 = `
        query {
          stream( id: "${ts1}" ) {
            branch( name: "main" ) {
              id
              name
              commits( limit: 3, cursor: "${res.body.data.stream.branch.commits.cursor}" ) {
                totalCount
                cursor
                items {
                  id
                  message
                  createdAt
                  referencedObject
                  authorId
                  authorName
                }
              }
            }
          }
        }`

        const res2 = await sendRequest( userA.token, { query: query2 } )
        // console.log( res2.body.errors )
        // console.log( res2.body.data.stream.branch.commits )

        expect( res2.body.data.stream.branch.commits.items.length ).to.equal( 3 )
        expect( res2.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'id' )
        expect( res2.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'message' )
        expect( res2.body.data.stream.branch.commits.items[ 0 ] ).to.have.property( 'createdAt' )
      } )

      let commitList

      it( 'should retrieve all stream commits', async ( ) => {
        let query = `
        query {
          stream( id: "${ts1}" ) {
            commits( limit: 10 ) {
              totalCount
              cursor
              items {
                id
                message
                authorId
                authorName
              }
            }
          }
        }
        `
        const res = await sendRequest( userA.token, { query: query } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.commits.items.length ).to.equal( 10 )
        expect( res.body.data.stream.commits.totalCount ).to.equal( 12 )

        commitList = res.body.data.stream.commits.items

        let query2 = `
        query {
          stream( id: "${ts1}" ) {
            commits( limit: 10, cursor: "${res.body.data.stream.commits.cursor}" ) {
              totalCount
              cursor
              items {
                id
                message
                authorId
                authorName
              }
            }
          }
        }
        `

        const res2 = await sendRequest( userA.token, { query: query2 } )

        expect( res2 ).to.be.json
        expect( res2.body.errors ).to.not.exist
        expect( res2.body.data.stream.commits.items.length ).to.equal( 2 )
      } )

      it( 'should retrieve a stream commit', async ( ) => {
        const res = await sendRequest( userA.token, { query: `query { stream( id:"${ts1}" ) { commit( id: "${commitList[ 0 ].id}" ) { id message referencedObject } } }` } )

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.commit.message ).to.equal( 'what a message for commit number 19' ) // should be the last created one
      } )

      it( 'should retrieve the latest stream commit if no id is specified', async ( ) => {
        const res = await sendRequest( userA.token, { query: `query { stream( id:"${ts1}" ) { commit { id message referencedObject } } }` } )
        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( res.body.data.stream.commit.message ).to.equal( 'what a message for commit number 19' ) // should be the last created one
      } )
    } )

    describe( 'Objects', ( ) => {
      let myCommit
      let myObjs

      before( async ( ) => {
        let { commit, objs } = generateManyObjects( 100, 'noise__' )
        myCommit = commit
        myObjs = objs
      } )

      it( 'should save many objects', async ( ) => {
        let everything = [ myCommit, ...myObjs ]
        const res = await sendRequest( userA.token, { query: `mutation($objs:[JSONObject]!) { objectCreate(objectInput: {streamId:"${ts1}", objects: $objs}) }`, variables: { objs: everything } } )

        let objIds = res.body.data.objectCreate

        expect( res ).to.be.json
        expect( res.body.errors ).to.not.exist
        expect( objIds.length ).to.equal( 101 ) // +1 for the actual "commit" object
      } )

      it( 'should get an object\'s subojects objects', async ( ) => {
        let first = await sendRequest( userA.token, {
          query: `
          query {
            stream( id:"${ts1}" ) {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 2 ) {
                  totalCount
                  cursor
                  objects {
                    id
                  }
                }
              }
            }
          }
          `
        } )

        expect( first ).to.be.json
        expect( first.body.errors ).to.not.exist
        expect( first.body.data.stream ).to.be.an( 'object' )
        expect( first.body.data.stream.object ).to.be.an( 'object' )
        expect( first.body.data.stream.object.children.objects.length ).to.equal( 2 )

        let second = await sendRequest( userA.token, {
          query: `
          query {
            stream(id:"${ts1}") {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 20, cursor: "${first.body.data.stream.object.children.cursor}", select: ["sortValueA", "nest.arr[2]"] ) {
                  totalCount
                  objects {
                    id
                    data
                  }
                }
              }
            }
          }
          `
        } )

        expect( second ).to.be.json
        expect( second.body.errors ).to.not.exist
        expect( second.body.data.stream ).to.be.an( 'object' )
        expect( second.body.data.stream.object ).to.be.an( 'object' )
        expect( second.body.data.stream.object.children.objects.length ).to.equal( 20 )
        expect( second.body.data.stream.object.children.objects[ 0 ].data.sortValueA ).to.equal( 52 ) // when sorting by id, it's always 52
        expect( second.body.data.stream.object.children.objects[ 0 ].data.nest.arr[ 2 ] ).to.equal( 52 ) // when sorting by id, it's always 52
      } )

      it( 'should query an object\'s subojects', async ( ) => {
        let first = await sendRequest( userA.token, {
          query: `
          query( $query: [JSONObject!], $orderBy: JSONObject ) {
            stream(id:"${ts1}") {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 20, select:[ "sortValueA" ], query: $query, orderBy: $orderBy ) {
                  totalCount
                  cursor
                  objects {
                    id
                    data
                  }
                }
              }
            }
          }
          `,
          variables: { query: [ { field: 'sortValueA', operator: '>=', value: 42 } ], orderBy: { field: 'sortValueA' } }
        } )

        expect( first ).to.be.json
        expect( first.body.errors ).to.not.exist
        expect( first.body.data.stream ).to.be.an( 'object' )
        expect( first.body.data.stream.object ).to.be.an( 'object' )
        expect( first.body.data.stream.object.children.objects.length ).to.equal( 20 )
        expect( first.body.data.stream.object.children.objects[ 0 ].data.sortValueA ).to.equal( 42 )
        expect( first.body.data.stream.object.children.objects[ 1 ].data.sortValueA ).to.equal( 43 )
      } )
    } )
  } )

  describe( 'Generic / Server Info', ( ) => {
    it( 'Should eval string for password strength', async ( ) => {
      const query = 'query { userPwdStrength( pwd: "garbage" ) } '
      const res = await sendRequest( null, { query } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
    } )

    it( 'Should return a valid server information object', async ( ) => {
      let q = `
        query{
          serverInfo{
            name
            adminContact
            termsOfService
            description
            version
            roles{
              name
              description
              resourceTarget
            }
            scopes{
              name
              description
            }
          }
        }`

      let res = await sendRequest( null, { query: q } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.serverInfo ).to.be.an( 'object' )

      let si = res.body.data.serverInfo
      expect( si.name ).to.be.a( 'string' )
      expect( si.adminContact ).to.be.a( 'string' )
      expect( si.termsOfService ).to.be.a( 'string' )
      expect( si.description ).to.be.a( 'string' )
      expect( si.roles ).to.be.a( 'array' )
      expect( si.scopes ).to.be.a( 'array' )
    } )

    it( 'Should update the server info object', async ( ) => {
      const query = 'mutation updateSInfo($info: ServerInfoUpdateInput!) { serverInfoUpdate( info: $info ) } '
      const variables = { info: { name: 'Super Duper Test Server Yo!', company: 'Super Systems' } }

      const res = await sendRequest( userA.token, { query, variables } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
    } )

    it( 'Should NOT update the server info object if user is not an admin', async ( ) => {
      const query = 'mutation updateSInfo( $info: ServerInfoUpdateInput! ) { serverInfoUpdate( info: $info ) } '
      const variables = { info: { name: 'Super Duper Test Server Yo!', company: 'Super Systems' } }

      const res = await sendRequest( userB.token, { query, variables } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.exist
    } )
  } )

  describe( 'Archived role access validation', ( ) => {
    let archivedUser = { name: 'Mark von Archival', email: 'archi@speckle.systems', password: 'i"ll be back, just wait' }
    let streamId
    before( async () => {
      archivedUser.id = await createUser( archivedUser )
      archivedUser.token = `Bearer ${
        ( 
          await createPersonalAccessToken(
            archivedUser.id,
            'this will be archived',
            [ 
              'streams:read',
              'streams:write',
              'users:read',
              'users:email',  
              'tokens:write',
              'tokens:read',
              'profile:read',
              'profile:email',
              'apps:read',
              'apps:write',
              'users:invite'
            ]
          )
        )
      }`
      await archiveUser( { userId: archivedUser.id } )
    } )

    it ( 'Should be able to read public streams', async () => {
      const streamRes = await sendRequest( userA.token, { query: 'mutation { streamCreate( stream: { name: "Share this with poor Mark", description: "💩", isPublic:true } ) }' } )
      const grantRes = await sendRequest( userA.token, {
        query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${streamRes.body.data.streamCreate}", userId: "${archivedUser.id}" role: "stream:contributor"}) }`
      } )
      expect ( grantRes.body.data.streamGrantPermission ).to.equal( true )

      let res = await sendRequest( archivedUser.token, { query: `query { stream(id:"${streamRes.body.data.streamCreate}") { id name } }` } )
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.stream.id ).to.equal( streamRes.body.data.streamCreate )
    } )

    it ( 'Should be forbidden to create token', async ( ) => {
      const query = 'mutation( $tokenInput:ApiTokenCreateInput! ) { apiTokenCreate ( token: $tokenInput ) }' 
      const res = await sendRequest( archivedUser.token, { query, variables: { tokenInput:{ scopes:[ 'streams:read' ], name: 'thisWillNotBeCreated', lifespan: 1000000 } } } )
      // WHY NOT 401 ???
      // expect( res ).to.have.status( 401 )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role' )
    } )

    it ( 'Should be forbidden to interact (read, write, delete) private streams it had access to', async () => {
      const streamRes = await sendRequest( userA.token, { query: 'mutation { streamCreate( stream: { name: "Share this with poor Mark", description: "💩", isPublic:false } ) }' } )
      streamId = streamRes.body.data.streamCreate
      const grantRes = await sendRequest( userA.token, {
        query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${streamId}", userId: "${archivedUser.id}" role: "stream:contributor"}) }`
      } )

      expect ( grantRes.body.data.streamGrantPermission ).to.equal( true )

      let res = await sendRequest( archivedUser.token, { query: `query { stream(id:"${streamId}") { id name } }` } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )

      res = await sendRequest( archivedUser.token, { query: '{ user { streams( limit: 30 ) { totalCount cursor items { id name } } } }' } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )

      res = await sendRequest( archivedUser.token, { query: `mutation { streamDelete( id:"${streamId}")}` } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )

      res = await sendRequest( archivedUser.token, { query: `mutation { streamUpdate(stream: {id:"${streamId}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }` } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to create streams, both public and private', async () => {
      const query = 'mutation ( $streamInput: StreamCreateInput!) { streamCreate(stream: $streamInput ) }'

      let res = await sendRequest( archivedUser.token, { query, variables: { streamInput:  { name: 'Trying to create stream', description: '💩', isPublic:false } } } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )

      res = await sendRequest( archivedUser.token, { query, variables: { streamInput:  { name: 'Trying to create stream', description: '💩', isPublic:true } } } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to add apps', async () => {
      const query = 'mutation createApp($myApp:AppCreateInput!) { appCreate( app: $myApp ) } '
      const variables = { myApp: { name: 'Test App', public: true, description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }

      const res = await sendRequest( archivedUser.token, { query, variables } )

      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to send email invites', async () => {
      const res = await sendRequest( archivedUser.token, {
        query: 'mutation inviteToServer($input: ServerInviteCreateInput!) { serverInviteCreate( input: $input ) }',
        variables: { input: { email: 'cabbages@speckle.systems', message: 'wow!' } }
      } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to create object', async () => {
      let objects = generateManyObjects( 10 )

      const res = await sendRequest( archivedUser.token, { query: `mutation( $objs: [JSONObject]! ) { objectCreate( objectInput: {streamId:"${ts1}", objects: $objs} ) }`, variables: { objs: objects.objs } } )

      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to create commit', async () => {
      const commit = {
        message : 'what a message for a first commit',
        streamId : streamId,
        objectId : 'justARandomHash',
        branchName : 'main'
      }
      let res = await sendRequest( archivedUser.token, { query: 'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }', variables: { myCommit: commit } } )
      expect( res.body.errors ).to.exist
      expect( res.body.errors[0].message ).to.equal( 'You do not have the required server role'  )
    } )

    it ( 'Should be forbidden to upload via rest API', async () => {
      let objects =  generateManyObjects( 2 )
      let res = await chai
        .request( expressApp )
        .post( `/objects/${streamId}` )
        .set( 'Authorization', archivedUser.token )
        .set( 'Content-type', 'multipart/form-data' )
        .attach( 'batch1', Buffer.from( JSON.stringify( objects.objs ), 'utf8' ) )
      expect( res ).to.have.status( 401 )
    } )

    it ( 'Should be forbidden to download from private stream it had access to via rest API', async () => {
      // even if the object doesn't exist, so im not creating it...
      let res = await chai
        .request( expressApp )
        .get( '/objects/thisIs/bogus' )
        .set( 'Authorization', archivedUser.token )
      expect( res ).to.have.status( 401 )
    } )

    it ( 'Should be able to download from public stream via rest API', async () => {
      const streamRes = await sendRequest( userA.token, { query: 'mutation { streamCreate( stream: { name: "Mark will read this", description: "🥔", isPublic:true } ) }' } )
      const grantRes = await sendRequest( userA.token, {
        query: `mutation{ streamGrantPermission( permissionParams: {streamId: "${streamRes.body.data.streamCreate}", userId: "${archivedUser.id}" role: "stream:contributor"}) }`
      } )
      expect ( grantRes.body.data.streamGrantPermission ).to.equal( true )
      let objects =  generateManyObjects( 2 )
      let res = await chai
        .request( expressApp )
        .post( `/objects/${streamRes.body.data.streamCreate}` )
        .set( 'Authorization', userA.token )
        .set( 'Content-type', 'multipart/form-data' )
        .attach( 'batch1', Buffer.from( JSON.stringify( objects.objs ), 'utf8' ) )
      expect( res ).to.have.status( 201 )

      res = await chai
        .request( expressApp )
        .get( `/objects/${streamRes.body.data.streamCreate}/${objects.objs[0].id}` )
        .set( 'Authorization', archivedUser.token )
      expect( res ).to.have.status( 200 )
      expect( res.body[0].id ).to.equal( objects.objs[0].id )
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
