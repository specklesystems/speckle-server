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
    userA.token = `Bearer ${(await createToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'user:read', 'token:create', 'token:read' ] ))}`
    userB.id = await createUser( userB )
    userB.token = `Bearer ${(await createToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'user:read', 'token:create', 'token:read' ] ))}`

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

  let objIds

  describe( 'Mutations', ( ) => {

    it( 'Should create some api tokens', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should revoke an api token', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should fail to revoke an api token', async ( ) => {
      assert.fail( 'todo' )
    } )
    
    it( 'Should create some streams', async ( ) => {
      const resS1 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "TS1 (u A) Private", description: "Hello World", isPublic:false } ) }` } )
      expect( resS1 ).to.be.json
      expect( resS1 ).to.have.status( 200 )
      expect( resS1.body.data ).to.have.property( 'streamCreate' )
      expect( resS1.body.data.streamCreate ).to.be.a( 'string' )
      ts1 = resS1.body.data.streamCreate

      const resS2 = await sendRequest( userA.token, { query: `mutation { streamCreate(stream: { name: "TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }` } )
      ts2 = resS2.body.data.streamCreate

      const resS3 = await sendRequest( userB.token, { query: `mutation { streamCreate(stream: { name: "TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }` } )
      ts3 = resS3.body.data.streamCreate

      const resS4 = await sendRequest( userB.token, { query: `mutation { streamCreate(stream: { name: "TS4 (u B)", description: "Hello Julian", isPublic:true } ) }` } )
      ts4 = resS4.body.data.streamCreate
    } )

    it( 'Should grant some permissions', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userB.id}" role: WRITE) }` } )

      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data.streamGrantPermission ).to.equal( true )
    } )

    it( 'Should update permissions', async ( ) => {
      const res = await sendRequest( userA.token, { query: `mutation{ streamGrantPermission( streamId: "${ts1}", userId: "${userB.id}" role: READ) }` } )

      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data.streamGrantPermission ).to.equal( true )
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
      expect( res ).to.have.status( 200 )
      expect( res.body.data.objectCreate ).to.have.lengthOf( objs.length )

      objIds = res.body.data.objectCreate

    } )

    let c1 = { description: 'test first commit' }
    let c2 = { description: 'test second commit' }

    it( 'Should create several commits', async ( ) => {
      let res = await sendRequest( userA.token, { query: `mutation($commit:JSONObject!) { commitCreate(streamId:"${ts1}", commit:$commit) }`, variables: { commit: c1 } } )

      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data ).to.have.property( 'commitCreate' )
      expect( res.body.data.commitCreate ).to.be.a( 'string' )
      c1.id = res.body.data.commitCreate

      res = await sendRequest( userA.token, { query: `mutation($commit:JSONObject!) { commitCreate(streamId:"${ts1}", commit:$commit) }`, variables: { commit: c2 } } )
      c2.id = res.body.data.commitCreate
    } )

    let tag1 = { name: 'v.10.0.0', description: 'test tag' }
    let tag2 = { name: 'v.20.0.0' }
    let tag3 = { name: 'v.21.0.1-alpha' }

    it( 'Should create two tags', async ( ) => {
      tag1.commitId = c1.id
      tag2.commitId = c2.id

      let res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag) }`, variables: { tag: tag1 } } )

      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data ).to.have.property( 'tagCreate' )
      tag1.id = res.body.data.tagCreate

      // create a second tag
      res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: tag2 } } )
      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data ).to.have.property( 'tagCreate' )
      tag2.id = res.body.data.tagCreate

      tag3.commitId = c2.id
      res = await sendRequest( userA.token, { query: `
        mutation($tag: TagCreateInput){tagCreate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: tag3 } } )

    } )

    it( 'Should update a tag', async ( ) => {
      const res = await sendRequest( userA.token, { query: `
        mutation($tag: TagUpdateInput){tagUpdate(streamId:"${ts1}", tag: $tag)}`, variables: { tag: { id: tag2.id, description: 'Cool description!' } } } )
      expect( res ).to.be.json
      expect( res ).to.have.status( 200 )
      expect( res.body.data ).to.have.property( 'tagUpdate' )
      expect( res.body.data.tagUpdate ).to.equal( true )
    } )

    it( 'Should create several branches', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should update a branch', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should delete a branch', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Authorization check: should fail on private stream with no access', async ( ) => {
      assert.fail( 'todo' )
    } )

  } )

  describe( 'Queries', ( ) => {
    describe( 'Users', ( ) => {
      it( 'Should retrieve my profile', async ( ) => {
        const res = await sendRequest( userA.token, {
          query: `{ user { id name email } }`
        } )

        expect( res ).to.be.json
        expect( res ).to.have.status( 200 )
        expect( res.body.data ).to.have.property( 'user' )
        expect( res.body.data.user.name ).to.equal( 'd1' )
        expect( res.body.data.user.email ).to.equal( 'd.1@speckle.systems' )
      } )

      it( 'Should retrieve a different profile profile', async ( ) => {
        const res = await sendRequest( userA.token, {
          query: ` { user(id:"${userB.id}") { id name email } }`
        } )

        expect( res ).to.be.json
        expect( res ).to.have.status( 200 )
        expect( res.body.data ).to.have.property( 'user' )
        expect( res.body.data.user.name ).to.equal( 'd2' )
        expect( res.body.data.user.email ).to.equal( 'd.2@speckle.systems' )
      } )
    } )

    describe( 'Streams', ( ) => {

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