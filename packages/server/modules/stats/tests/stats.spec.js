/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init, startHttp } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )

const crypto = require( 'crypto' )
const { createUser } = require( `${appRoot}/modules/core/services/users` )
const { createPersonalAccessToken } = require( `${appRoot}/modules/core/services/tokens` )
const { createStream } = require( `${appRoot}/modules/core/services/streams` )
const { createObjects } = require( `${appRoot}/modules/core/services/objects` )
const { createCommitByBranchName, createCommitByBranchId } = require( `${appRoot}/modules/core/services/commits` )

const { getStreamHistory, getCommitHistory, getObjectHistory, getUserHistory, getTotalStreamCount, getTotalCommitCount, getTotalObjectCount, getTotalUserCount } = require( '../services' )

const params = { numUsers: 25, numStreams: 30, numObjects: 100, numCommits: 100 }

describe( 'Server stats services @stats-services', function() {

  before( async function() {
    this.timeout( 10000 )

    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    await init()
    await seedDb( params )
  } )

  after( async() => {
    await knex.migrate.rollback( )
  } )

  it( 'should return the total number of users on this server', async () => {
    let res = await getTotalUserCount()
    expect( res ).to.equal( params.numUsers )
  } )

  it( 'should return the total number of streams on this server', async() => {
    let res = await getTotalStreamCount()
    expect( res ).to.equal( params.numStreams )
  } )

  it( 'should return the total number of commits on this server', async() => {
    let res = await getTotalCommitCount()
    expect( res ).to.equal( params.numCommits )
  } )

  it( 'should return the total number of objects on this server', async() => {
    let res = await getTotalObjectCount()
    expect( res ).to.equal( params.numObjects )
  } )

  it( 'should return the stream creation history by month', async() => {
    let res = await getStreamHistory()
    expect( res ).to.be.an( 'array' )
    expect( res[0] ).to.have.property( 'count' )
    expect( res[0] ).to.have.property( 'created_month' )
    expect( res[0].count ).to.be.a( 'number' )
    expect( res[0].count ).to.equal( params.numStreams )
  } )

  it( 'should return the commit creation history by month', async() => {
    let res = await getCommitHistory()
    expect( res ).to.be.an( 'array' )
    expect( res[0] ).to.have.property( 'count' )
    expect( res[0] ).to.have.property( 'created_month' )
    expect( res[0].count ).to.be.a( 'number' )
    expect( res[0].count ).to.equal( params.numCommits )
  } )

  it( 'should return the object creation history by month', async() => {
    let res = await getObjectHistory()
    expect( res ).to.be.an( 'array' )
    expect( res[0] ).to.have.property( 'count' )
    expect( res[0] ).to.have.property( 'created_month' )
    expect( res[0].count ).to.be.a( 'number' )
    expect( res[0].count ).to.equal( params.numObjects )
  } )

  it( 'should return the user creation history by month', async() => {
    let res = await getUserHistory()
    expect( res ).to.be.an( 'array' )
    expect( res[0] ).to.have.property( 'count' )
    expect( res[0] ).to.have.property( 'created_month' )
    expect( res[0].count ).to.be.a( 'number' )
    expect( res[0].count ).to.equal( params.numUsers )
  } )

} )

let addr = `http://localhost:3333`

describe( 'Server stats api @stats-api', function() {
  let testServer
  let adminUser = {
    name: 'Dimitrie',
    password: 'TestPasswordSecure',
    email: 'spam@spam.spam'
  }

  let notAdminUser = {
    name: 'Andrei',
    password: 'TestPasswordSecure',
    email: 'spasm@spam.spam'
  }

  let fullQuery = `
  query{
    serverStats{
      totalStreamCount
      totalCommitCount
      totalObjectCount
      totalUserCount
      streamHistory
      commitHistory
      objectHistory
      userHistory
      }
    }
    `

  before( async function() {
    this.timeout( 10000 )
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let { app } = await init( )
    let { server } = await startHttp( app, 3333 )
    testServer = server

    adminUser.id = await createUser( adminUser )
    adminUser.goodToken = `Bearer ${( await createPersonalAccessToken( adminUser.id, 'test token user A', [ 'server:stats' ] ) )}`
    adminUser.badToken = `Bearer ${( await createPersonalAccessToken( adminUser.id, 'test token user A', [ 'streams:read' ] ) )}`

    notAdminUser.id = await createUser( notAdminUser )
    notAdminUser.goodToken = `Bearer ${( await createPersonalAccessToken( notAdminUser.id, 'test token user A', [ 'server:stats' ] ) )}`
    notAdminUser.badToken = `Bearer ${( await createPersonalAccessToken( notAdminUser.id, 'test token user A', [ 'streams:read' ] ) )}`

    await seedDb( params )

  } )

  after( async function() {
    await knex.migrate.rollback( )
    testServer.close( )
  } )

  it( 'Should not get stats if user is not admin', async() => {

    let res = await sendRequest( adminUser.badToken, { query: fullQuery } )
    expect( res.body.errors ).to.exist
    expect( res.body.errors[0].extensions.code ).to.equal( 'FORBIDDEN' )

  } )

  it( 'Should not get stats if user is not admin even if the token has the correct scopes', async() => {
    let res = await sendRequest( notAdminUser.goodToken, { query: fullQuery } )
    expect( res.body.errors ).to.exist
    expect( res.body.errors[0].extensions.code ).to.equal( 'FORBIDDEN' )
  } )

  it( 'Should not get stats if token does not have required scope', async() => {
    let res = await sendRequest( adminUser.badToken, { query: fullQuery } )
    expect( res ).to.be.json
    expect( res.body.errors ).to.exist
    expect( res.body.errors[0].extensions.code ).to.equal( 'FORBIDDEN' )
  } )

  it( 'Should get server stats', async() => {
    let res = await sendRequest( adminUser.goodToken, { query: fullQuery } )
    expect( res ).to.be.json
    expect( res.body.errors ).to.not.exist

    expect( res.body.data ).to.have.property( 'serverStats' )
    expect( res.body.data.serverStats ).to.have.property( 'totalStreamCount' )
    expect( res.body.data.serverStats ).to.have.property( 'totalCommitCount' )
    expect( res.body.data.serverStats ).to.have.property( 'totalObjectCount' )
    expect( res.body.data.serverStats ).to.have.property( 'totalUserCount' )
    expect( res.body.data.serverStats ).to.have.property( 'streamHistory' )
    expect( res.body.data.serverStats ).to.have.property( 'commitHistory' )
    expect( res.body.data.serverStats ).to.have.property( 'userHistory' )

    expect( res.body.data.serverStats.totalStreamCount ).to.equal( params.numStreams )
    expect( res.body.data.serverStats.totalCommitCount ).to.equal( params.numCommits )
    expect( res.body.data.serverStats.totalObjectCount ).to.equal( params.numObjects )
    expect( res.body.data.serverStats.totalUserCount ).to.equal( params.numUsers + 2 ) // we're registering two extra users in the before hook

    expect( res.body.data.serverStats.streamHistory ).to.be.an( 'array' )
    expect( res.body.data.serverStats.commitHistory ).to.be.an( 'array' )
    expect( res.body.data.serverStats.userHistory ).to.be.an( 'array' )

  } )

} )

async function seedDb( { numUsers = 10, numStreams = 10, numObjects = 10, numCommits = 10 } = {} ) {
  let users = []
  let streams = []

  // create users
  for ( let i = 0; i < numUsers; i++ ) {
    let id = await createUser( { name: `User ${i}`, password: `SuperSecure${i}${i*3.14}`, email: `user${i}@speckle.systems` } )
    users.push( id )
  }

  // create streams
  for ( let i = 0; i < numStreams; i++ ) {
    let id = await createStream( { name: `Stream ${i}`, ownerId: users[i >= users.length ? users.length - 1 : i ] } )
    streams.push( id )
  }

  // create a objects
  let mockObjects = createManyObjects( numObjects - 1 )
  let objs = await createObjects( streams[ 0 ], mockObjects )
  let commits = []

  // create commits referencing those objects
  for ( let i = 0; i < numCommits; i++ ) {
    let id = await createCommitByBranchName( {
      streamId: streams[0],
      branchName: 'main',
      sourceApplication: 'tests',
      objectId: objs[ i >= objs.length ? objs.length - 1 : i ]
    } )
    commits.push( id )
  }

}

function createManyObjects( num, noise ) {
  num = num || 10000
  noise = noise || Math.random( ) * 100

  let objs = [ ]

  let base = { name: 'base bastard 2', noise: noise, __closure: {} }
  objs.push( base )
  let k = 0

  for ( let i = 0; i < num; i++ ) {
    let baby = { name: `mr. ${i}`, nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [ i + 42, i, i ] } }
    getAnId( baby )
    base.__closure[ baby.id ] = 1
    objs.push( baby )
  }
  getAnId( base )
  return objs
}

function getAnId( obj ) {
  obj.id = obj.id || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
}

function sendRequest( auth, obj, address = addr ) {
  return chai.request( address ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )
}
