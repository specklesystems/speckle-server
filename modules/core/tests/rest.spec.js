const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const request = require( 'supertest' )

const assert = require( 'assert' )
const crypto = require( 'crypto' )
const appRoot = require( 'app-root-path' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser } = require( '../services/users' )
const { createPersonalAccessToken } = require( '../services/tokens' )
const { createStream } = require( '../services/streams' )

describe( `Upload/Download Routes`, ( ) => {

  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }
  let testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream'
  }

  let expressApp
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let { app } = await init( )
    expressApp = app

    userA.id = await createUser( userA )
    userA.token = `Bearer ${(await createPersonalAccessToken( userA.id, 'test token user A', [ 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email' ] ))}`

    testStream.id = await createStream( testStream, userA.id )
  } )

  after( async ( ) => {} )

  it( 'Should not allow upload requests without an authorization token or valid streamId', async ( ) => {

    // invalid token and streamId
    let res = await chai.request( expressApp ).get( `/objects/wow_hack/null` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid token
    res = await chai.request( expressApp ).get( `/objects/${testStream.id}/null` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid streamid
    res = await chai.request( expressApp ).get( `/objects/${'thisDoesNotExist'}/null` ).set( 'Authorization', userA.token )
    expect( res ).to.have.status( 401 )
  } )

  it( 'Should not allow download requests without an authorization token or valid streamId', async ( ) => {
    // invalid token and streamId
    let res = await chai.request( expressApp ).post( `/objects/wow_hack` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid token
    res = await chai.request( expressApp ).post( `/objects/${testStream.id}` ).set( 'Authorization', 'this is a hoax' )
    expect( res ).to.have.status( 401 )

    // invalid streamid
    res = await chai.request( expressApp ).post( `/objects/${'thisDoesNotExist'}` ).set( 'Authorization', userA.token )
    expect( res ).to.have.status( 401 )
  } )

  let parentId

  it( 'Should properly upload a bunch of objects', async ( ) => {
    let objBatches = [ createManyObjects( 3000 ), createManyObjects( 3000 ), createManyObjects( 3000 ) ]
    parentId = objBatches[0][0].id

    let res =
      await request( expressApp )
      .post( `/objects/${testStream.id}` )
      .set( 'Authorization', userA.token )
      .attach( 'batch1', Buffer.from( JSON.stringify( objBatches[ 0 ] ), 'utf8' ) )
      .attach( 'batch2', Buffer.from( JSON.stringify( objBatches[ 1 ] ), 'utf8' ) )
      .attach( 'batch3', Buffer.from( JSON.stringify( objBatches[ 2 ] ), 'utf8' ) )

    expect( res ).to.have.status( 303 )
  } )

  it( 'Should properly download an object, with all its children', async ( ) => {
    console.log( parentId )
    let res = await request( expressApp )
      .get(`/objects/${testStream.id}/${parentId}` )
      .set( 'Authorization', userA.token )

    console.log( res.status)
    assert.fail( )
  } )

} )

function createManyObjects( amount, noise ) {
  amount = amount || 10000
  noise = noise || Math.random( ) * 100

  let objs = [ ]

  let base = { name: 'base bastard 2', noise: noise, __closure: {} }
  objs.push( base )
  let k = 0

  for ( let i = 0; i < amount; i++ ) {
    let baby = {
      name: `mr. ${i}`,
      nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [ i + 42, i, i ] },
      test: { value: i, secondValue: 'mallard ' + i % 10 },
      similar: k,
    }

    if ( i % 3 === 0 ) k++
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