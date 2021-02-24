/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const request = require( 'supertest' )

const assert = require( 'assert' )
const crypto = require( 'crypto' )
const appRoot = require( 'app-root-path' )
const zlib = require( 'zlib' )


const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser } = require( '../services/users' )
const { createPersonalAccessToken } = require( '../services/tokens' )
const { createStream } = require( '../services/streams' )

describe( 'Upload/Download Routes @api-rest', ( ) => {

  let userA = { name: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let userB = { name: 'd2', email: 'd.2@speckle.systems', password: 'wow' }

  let testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream'
  }

  let privateTestStream = { name: 'Private Test Stream', isPublic: false }

  let expressApp
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let { app } = await init( )
    expressApp = app

    userA.id = await createUser( userA )
    userA.token = `Bearer ${( await createPersonalAccessToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`

    userB.id = await createUser( userB )
    userB.token = `Bearer ${( await createPersonalAccessToken( userB.id, 'test token user B', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ) )}`

    testStream.id = await createStream( { ...testStream, ownerId: userA.id } )
    privateTestStream.id = await createStream( { ...privateTestStream, ownerId: userA.id } )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  it( 'Should not allow download requests without an authorization token or valid streamId', async ( ) => {

    // invalid token and streamId
    let res = await chai.request( expressApp ).get( '/objects/wow_hack/null' ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 404 )

    // invalid token
    res = await chai.request( expressApp ).get( `/objects/${testStream.id}/null` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 404 )

    // invalid streamid
    res = await chai.request( expressApp ).get( `/objects/${'thisDoesNotExist'}/null` ).set( 'Authorization', userA.token )
    expect( res ).to.have.status( 404 )

    // create some objects
    let objBatches = [ createManyObjects( 20 ), createManyObjects( 20 ) ]

    await request( expressApp )
      .post( `/objects/${testStream.id}` )
      .set( 'Authorization', userA.token )
      .set( 'Content-type', 'multipart/form-data' )
      .attach( 'batch1', Buffer.from( JSON.stringify( objBatches[ 0 ] ), 'utf8' ) )
      .attach( 'batch2', Buffer.from( JSON.stringify( objBatches[ 1 ] ), 'utf8' ) )

    // should allow invalid tokens (treat them the same as no tokens?)
    res = await chai.request( expressApp ).get( `/objects/${testStream.id}/${objBatches[0][0].id}` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 200 )

    // should not allow invalid tokens on private streams
    res = await chai.request( expressApp ).get( `/objects/${privateTestStream.id}/${objBatches[0][0].id}` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // should not allow user b to access user a's private stream
    res = await chai.request( expressApp ).get( `/objects/${privateTestStream.id}/${objBatches[0][0].id}` ).set( 'Authorization', userB.token )
    expect( res ).to.have.status( 401 )

  } )

  it( 'Should not allow upload requests without an authorization token or valid streamId', async ( ) => {
    // invalid token and streamId
    let res = await chai.request( expressApp ).post( '/objects/wow_hack' ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid token
    res = await chai.request( expressApp ).post( `/objects/${testStream.id}` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid streamid
    res = await chai.request( expressApp ).post( `/objects/${'thisDoesNotExist'}` ).set( 'Authorization', userA.token )
    expect( res ).to.have.status( 401 )
  } )

  let parentId
  let numObjs = 5000

  it( 'Should properly upload a bunch of objects', async ( ) => {
    let objBatches = [ createManyObjects( numObjs ), createManyObjects( numObjs ), createManyObjects( numObjs ) ]
    parentId = objBatches[ 0 ][ 0 ].id

    let res =
      await request( expressApp )
        .post( `/objects/${testStream.id}` )
        .set( 'Authorization', userA.token )
        .set( 'Content-type', 'multipart/form-data' )
        .attach( 'batch1', Buffer.from( JSON.stringify( objBatches[ 0 ] ), 'utf8' ) )
        .attach( 'batch2', Buffer.from( JSON.stringify( objBatches[ 1 ] ), 'utf8' ) )
        .attach( 'batch3', Buffer.from( JSON.stringify( objBatches[ 2 ] ), 'utf8' ) )

    // TODO: test gziped uploads. They work. Current blocker: cannot set content-type for each part in the 'multipart' request.
    // .attach( 'batch1', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 0 ] ) ), 'utf8' ) )
    // .attach( 'batch2', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 1 ] ) ), 'utf8' ) )
    // .attach( 'batch3', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 2 ] ) ), 'utf8' ) )

    expect( res ).to.have.status( 201 )
  } )

  it( 'Should properly download an object, with all its children, into a application/json response', ( done ) => {
    new Promise( resolve => setTimeout( resolve, 1500 ) ) // avoids race condition
      .then( ( ) => {
        let res = request( expressApp )
          .get( `/objects/${testStream.id}/${parentId}` )
          .set( 'Authorization', userA.token )
          .buffer( )
          .parse( ( res, cb ) => {
            res.data = ''
            res.on( 'data', chunk => {
              res.data += chunk.toString( )
            } )
            res.on( 'end', ( ) => {
              cb( null, res.data )
            } )
          } )
          .end( ( err, res ) => {
            if ( err ) done( err )
            try {
              let o = JSON.parse( res.body )
              expect( o.length ).to.equal( numObjs + 1 )
              expect( res ).to.be.json
              done( )
            } catch ( err ) {
              done( err )
            }
          } )
      } )
  } ).timeout( 5000 )

  it( 'Should properly download an object, with all its children, into a text/plain response', ( done ) => {

    let res = request( expressApp )
      .get( `/objects/${testStream.id}/${parentId}` )
      .set( 'Authorization', userA.token )
      .set( 'Accept', 'text/plain' )
      .buffer( )
      .parse( ( res, cb ) => {
        res.data = ''
        res.on( 'data', chunk => {
          res.data += chunk.toString( )
        } )
        res.on( 'end', ( ) => {
          cb( null, res.data )
        } )
      } )
      .end( ( err, res ) => {
        if ( err ) done( err )
        try {
          let o = res.body.split( '\n' ).filter( l => l !== '' )
          expect( o.length ).to.equal( numObjs + 1 )
          expect( res ).to.be.text
          done( )
        } catch ( err ) {
          done( err )
        }
      } )

  } )

} )

function createManyObjects( amount, noise ) {
  amount = amount || 10000
  noise = noise || Math.random( ) * 100

  let objs = [ ]

  let base = { name: 'base bastard 2', noise: noise, __closure: {} }
  objs.push( base )

  for ( let i = 0; i < amount; i++ ) {
    let baby = { name: `mr. ${i}` }
    getId( baby )
    base.__closure[ baby.id ] = 1
    objs.push( baby )
  }

  getId( base )
  return objs
}

function getId( obj ) {
  obj.id = obj.id || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
}
