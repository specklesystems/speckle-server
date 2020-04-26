const crypto = require( 'crypto' )
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init, startHttp } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

const { createUser, createToken } = require( '../users/services' )

let addr

describe( 'GraphQL API Core', ( ) => {
  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', username: 'd2', email: 'd.2@speckle.systems', password: 'wow' }
  let testServer

  before( async ( ) => {
    await knex.migrate.latest( )
    let { app } = await init( )
    let { server } = await startHttp( app )
    testServer = server

    userA.id = await createUser( userA )
    userA.token = `Bearer ${(await createToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:create', 'tokens:read', 'tokens:delete' ] ))}`
    userB.id = await createUser( userB )
    userB.token = `Bearer ${(await createToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:create', 'tokens:read', 'tokens:delete' ] ))}`

    addr = `http://localhost:${process.env.PORT || 3000}`
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
    testServer.close( )
  } )

  // the four stream ids
  let ts1
  let ts2
  let ts3
  let ts4
  let ts5

  // some api tokens
  let token1
  let token2
  let token3

  // object ids
  let objIds

  // some commits
  let c1 = { description: 'test first commit' }
  let c2 = { description: 'test second commit' }

  // some tags
  let tag1 = { name: 'v.10.0.0', description: 'test tag' }
  let tag2 = { name: 'v.20.0.0' }
  let tag3 = { name: 'v.21.0.1-alpha' }

  // some branches
  let b1 = { name: 'branch 1', description: 'test branch' }
  let b2 = { name: 'master', description: 'master branch' }
  let b3 = { name: 'branch 3', description: 'wow' }

  describe( 'Mutations', ( ) => {

    it( 'Should create some api tokens', async ( ) => {
      const res1 = await sendRequest( userA.token, { query: `mutation { apiTokenCreate(name:"Token 1", scopes: ["streams:read", "users:read"]) }` } )
      expect( res1 ).to.be.json
      expect( res1.body.errors ).to.not.exist
      expect( res1.body.data.apiTokenCreate ).to.be.a( 'string' )

      token1 = `Bearer ${res1.body.data.apiTokenCreate}`

      const res2 = await sendRequest( userA.token, { query: `mutation { apiTokenCreate(name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]) }` } )
      token2 = `Bearer ${res2.body.data.apiTokenCreate}`

      const res3 = await sendRequest( userB.token, { query: `mutation { apiTokenCreate(name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]) }` } )
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
      const res = await sendRequest( token1, { query: `mutation { streamCreate(stream: { name: "INVALID TS1 (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( res.body.errors ).to.exist
    } )

    it( 'Should edit my profile', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation($user:UserEditInput!) { userEdit( user: $user) } `, variables: { user: { name: 'Miticå', bio: 'He never really knows what he is doing.' } } } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.userEdit ).to.equal( true )
    } )

    it( 'Should create some streams', async ( ) => {
      const resS1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "TS1 (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( resS1 ).to.be.json
      expect( resS1.body.errors ).to.not.exist
      expect( resS1.body.data ).to.have.property( 'streamCreate' )
      expect( resS1.body.data.streamCreate ).to.be.a( 'string' )
      ts1 = resS1.body.data.streamCreate

      const resS2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }` } )
      ts2 = resS2.body.data.streamCreate

      const resS3 = await sendRequest( userB.token, { query: `mutation { streamCreate(stream: { name: "TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }` } )
      ts3 = resS3.body.data.streamCreate

      const resS4 = await sendRequest( userB.token, { query: `mutation { streamCreate(stream: { name: "TS4 (u B)", description: "Hello Julian", isPublic:true } ) }` } )
      ts4 = resS4.body.data.streamCreate

      const resS5 = await sendRequest( userB.token, { query: `mutation { streamCreate(stream: { name: "TS5 (u B)", description: "Hello King", isPublic:true } ) }` } )
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
      const res = await sendRequest( userA.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userB.id}" role: WRITE) }` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.streamGrantPermission ).to.equal( true )

      const res2 = await sendRequest( userB.token, { query: `mutation{ streamGrantPermission( streamId: "${ts5}", userId: "${userA.id}" role: WRITE) }` } )
    } )

    it( 'Should fail to grant permissions if not owner', async ( ) => {
      const res = await sendRequest( userB.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userB.id}" role: WRITE) }` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.exist
    } )

    it( 'Should fail to grant myself permissions', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userA.id}" role: WRITE) }` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.exist
    } )

    it( 'Should update permissions', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userB.id}" role: READ) }` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.streamGrantPermission ).to.equal( true )
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

    it( 'Should create some objects', async ( ) => {
      let objs = [ ]
      for ( let i = 0; i < 500; i++ ) {
        if ( i % 2 === 0 ) objs.push( { applicationId: i, type: 'Point', x: i, y: 1, z: i * 0.42, extra: { super: true, arr: [ 1, 2, 3, 4 ] } } )
        else if ( i % 3 === 0 ) objs.push( { applicationId: i, type: 'Line', start: { x: i, y: 1, z: i * 0.42 }, end: { x: 0, y: 2, z: i * i }, extra: { super: false, arr: [ 12, 23, 34, 42, { imp: [ 'possible', 'this', 'sturcture', 'is' ] } ] } } )
        else objs.push( { cool: [ 's', 't', [ 'u', 'f', 'f', i ], { that: true } ], iValue: i + i / 3 } )
      }

      const res = await sendRequest( userA.token, { query: `mutation($objs:[JSONObject]!) { objectCreate(streamId:"${ts1}", objects: $objs) }`, variables: { objs: objs } } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.objectCreate ).to.have.lengthOf( objs.length )

      objIds = res.body.data.objectCreate

    } )

    it( 'Should create several commits', async ( ) => {
      c1.id = crypto.createHash( 'md5' ).update( JSON.stringify( c1 ) ).digest( 'hex' )
      let res = await sendRequest( userA.token, { query: `mutation($commit:JSONObject!) { commitCreate(streamId:"${ts1}", commit:$commit) }`, variables: { commit: c1 } } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'commitCreate' )
      expect( res.body.data.commitCreate ).to.be.a( 'string' )
      c1.id = res.body.data.commitCreate

      res = await sendRequest( userA.token, { query: `mutation($commit:JSONObject!) { commitCreate(streamId:"${ts1}", commit:$commit) }`, variables: { commit: c2 } } )
      c2.id = res.body.data.commitCreate
    } )

    it( 'Should create two tags', async ( ) => {
      tag1.commitId = c1.id
      tag2.commitId = c2.id

      let res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag) }`, variables: { tag: tag1 } } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'tagCreate' )
      tag1.id = res.body.data.tagCreate

      // create a second tag
      res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: tag2 } } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'tagCreate' )
      tag2.id = res.body.data.tagCreate

      tag3.commitId = c2.id
      res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: tag3 } } )
      tag3.id = res.body.data.tagCreate
    } )

    it( 'Should update a tag', async ( ) => {
      const res = await sendRequest( userA.token, { query: `
        mutation($tag: TagUpdateInput){tagUpdate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: { id: tag2.id, description: 'Cool description!' } } } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'tagUpdate' )
      expect( res.body.data.tagUpdate ).to.equal( true )
    } )

    it( 'Should delete a tag', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation{ tagDelete(streamId:"${ts1}", tagId:"${tag3.id}")}` } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'tagDelete' )
      expect( res.body.data.tagDelete ).to.equal( true )
    } )

    it( 'Should create several branches', async ( ) => {
      const res1 = await sendRequest( userA.token, { query: `mutation($branch:BranchCreateInput!) { branchCreate(streamId:"${ts1}", branch:$branch) }`, variables: { branch: b1 } } )
      expect( res1 ).to.be.json
      expect( res1.body.errors ).to.not.exist
      expect( res1.body.data ).to.have.property( 'branchCreate' )
      expect( res1.body.data.branchCreate ).to.be.a( 'string' )
      b1.id = res1.body.data.branchCreate

      const res2 = await sendRequest( userB.token, { query: `mutation($branch:BranchCreateInput!) { branchCreate(streamId:"${ts1}", branch:$branch) }`, variables: { branch: b2 } } )
      b2.id = res2.body.data.branchCreate

      const res3 = await sendRequest( userB.token, { query: `mutation($branch:BranchCreateInput!) { branchCreate(streamId:"${ts1}", branch:$branch) }`, variables: { branch: b3 } } )
      b3.id = res3.body.data.branchCreate
    } )

    it( 'Should update a branch', async ( ) => {
      const res1 = await sendRequest( userA.token, { query: `mutation($branch:BranchUpdateInput!) { branchUpdate(streamId:"${ts1}", branch:$branch) }`, variables: { branch: { id: b1.id, commits: [ c1.id ] } } } )
      expect( res1 ).to.be.json
      expect( res1.body.errors ).to.not.exist
      expect( res1.body.data ).to.have.property( 'branchUpdate' )
      expect( res1.body.data.branchUpdate ).to.equal( true )
    } )

    it( 'Should delete a branch', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation { branchDelete(streamId:"${ts1}", branchId:"${b2.id}")}` } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'branchDelete' )
      expect( res.body.data.branchDelete ).to.equal( true )
    } )

    it( 'Should fail to delete a stream because of permissions', async ( ) => {
      const res = await sendRequest( userB.token, { query: `mutation { streamDelete( id:"${ts1}")}` } )
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

  } )

  describe( 'Queries', ( ) => {

    it( 'Should retrieve my profile', async ( ) => {
      const res = await sendRequest( userA.token, { query: `{ user { id name email } }` } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'user' )
      expect( res.body.data.user.name ).to.equal( 'Miticå' )
      expect( res.body.data.user.email ).to.equal( 'd.1@speckle.systems' )
    } )

    it( 'Should retrieve a different profile profile', async ( ) => {
      const res = await sendRequest( userA.token, { query: ` { user(id:"${userB.id}") { id name email } }` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data ).to.have.property( 'user' )
      expect( res.body.data.user.name ).to.equal( 'd2' )
      expect( res.body.data.user.email ).to.equal( 'd.2@speckle.systems' )
    } )

    it( 'Should not retrieve a profile if no auth', async ( ) => {
      const res = await sendRequest( null, { query: `{ user { id name email } }` } )
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

    it( 'Should retrieve my streams', async ( ) => {
      const res = await sendRequest( userA.token, { query: `{ user { streamCollection { totalCount streams { id name role } } } }` } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.user.streamCollection.totalCount ).to.equal( 3 )

      let streams = res.body.data.user.streamCollection.streams
      let s1 = streams.find( s => s.name === 'TS1 (u A) Private UPDATED' )
      expect( s1 ).to.exist
    } )

    it( 'Should only retrieve public streams from a different user profile ', async ( ) => {
      const res = await sendRequest( token1, { query: `query { user(id:"${userB.id}") { streamCollection { totalCount streams { id name isPublic role }} } }` } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.user.streamCollection.totalCount ).to.equal( 1 )
    } )

    let retrievedStream
    it( 'Should fully retrieve a stream', async ( ) => {
      const res = await sendRequest( userA.token, { query: `query { 
        stream(id:"${ts1}") {
          id
          name
          createdAt
          updatedAt
          clonedFrom {
            id
          }
          role
          commits(offset:0 limit:100) {
            totalCount
            commits {
              id
              description
            }
          }
          tags(offset:0 limit: 10) {
            totalCount
            tags {
              id
              name
              commit {
                id
                description
              }
            }
          }
          branches(offset:0 limit: 10 ) {
            totalCount
            branches {
              id
              name
            }
          }
          users {
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
      expect( stream.tags.totalCount ).to.equal( 2 )
      expect( stream.branches.totalCount ).to.equal( 1 )
      expect( stream.commits.totalCount ).to.equal( 2 )
      expect( stream.users ).to.have.lengthOf( 2 )
    } )

    it( 'should retrieve a stream branch', async ( ) => {
      // note: adding another commit for the sake of it
      const res1 = await sendRequest( userA.token, { query: `mutation($branch:BranchUpdateInput!) { branchUpdate(streamId:"${ts1}", branch:$branch) }`, variables: { branch: { id: b1.id, commits: [ c2.id ] } } } )
      const res = await sendRequest( userA.token, { query: `query { stream(id:"${ts1}") { branch(id:"${retrievedStream.branches.branches[0].id}") { name description commits { totalCount } } } } ` } )

      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.stream.branch.name ).to.equal( 'branch 1' )
      expect( res.body.data.stream.branch.commits.totalCount ).to.equal( 2 )

    } )
    it( 'should retrieve a stream tag', async ( ) => {
      const res = await sendRequest( userA.token, { query: `query { stream(id:"${ts1}") { tag(id:"${retrievedStream.tags.tags[0].id}") { name description commit { id description } } } } ` } )
      
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.stream.tag ).to.have.property( 'name' )
      expect( res.body.data.stream.tag ).to.have.property( 'description' )
      expect( res.body.data.stream.tag ).to.have.property( 'commit' )

    } )
    it( 'should retrieve a stream commit', async ( ) => {
      assert.fail( 'not implemented yet' )
    } )
    it( 'should retrieve commit/object children', async ( ) => {
      assert.fail( 'not implemented yet' )
    } )

  } )
} )

/**
 * Sends a graphql reuqest. Convenience wrapper.
 * @param  {string} auth the users's token
 * @param  {string} obj  the query/mutation to send
 * @return {Promise}      the awaitable request
 */
function sendRequest( auth, obj ) {
  return chai.request( addr ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )
}