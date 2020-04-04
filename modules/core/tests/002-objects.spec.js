const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const root = require( 'app-root-path' )
const { init } = require( `${root}/app` )
const knex = require( `${root}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../users/services' )
const { createStream, getStream, updateStream, deleteStream, getStreamsUser, grantPermissionsStream, revokePermissionsStream } = require( '../streams/services' )
const { createObject, createObjects, getObject, getObjects } = require( '../objects/services' )

let sampleCommit = JSON.parse( `{
  "Objects": [
    {
      "speckle_type": "reference",
      "referencedId": "8a9b0676b7fe3e5e487bb34549e67f67"
    }
  ],
  "Description": "draft commit",
  "Parents": [
    "beb6c53c4e531f4c259a59e943dd3043"
  ],
  "CreatedOn": "2020-03-18T12:06:07.82307Z",
  "hash": "79eb41764cc2c065de752bd704bfc4aa",
  "speckle_type": "Speckle.Core.Commit",
  "__tree": [
    "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67"
  ]
}` )

let sampleObject = JSON.parse( `{
  "Vertices": [],
  "hash": "8a9b0676b7fe3e5e487bb34549e67f67",
  "applicationId": "test",
  "speckle_type": "Tests.Polyline"
}` )

describe( 'Objects', ( ) => {

  let userOne = {
    username: 'dim42',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie43@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    userOne.id = await createUser( userOne )
    stream.id = await createStream( stream, userOne.id )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  describe( 'Services/Queries', ( ) => {

    before( async ( ) => {

    } )

    it( 'Should create objects', async ( ) => {
      sampleObject.hash = await createObject( stream.id, userOne.id, sampleObject )
      sampleCommit.hash = await createObject( stream.id, userOne.id, sampleCommit )
    } )

    let objCount_1 = 10
    let objCount_2 = 1000
    let objs = [ ]
    let objs2 = [ ]

    it( `Should create ${objCount_1} objects`, async ( ) => {
      for ( let i = 0; i < objCount_1; i++ ) {
        objs.push( {
          amazingness: i * i,
          somethingness: `Sample ${i%2===0 ? 'SUPER MEGA' : '1010101000010101'} ERRR`,
          __tree: [
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67",
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f67" + i / 2.0,
            "79eb41764cc2c065de752bd704bfc4aa." + i + "." + i * i,
          ]
        } )
      }

      let hashes = await createObjects( stream.id, userOne.id, objs )

      expect( hashes ).to.have.lengthOf( objCount_1 )

    } ).timeout( 30000 )

    it( `Should create ${objCount_2} objects`, async ( ) => {
      for ( let i = 0; i < objCount_2; i++ ) {
        objs2.push( {
          amazingness: i * i,
          somethingness: `Sample HASH ${i%2===0 ? 'SUPER MEGA HASH CHANGE' : '1010101000010101'} ERRR`,
          __tree: [
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f6723",
            "79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e623237f67" + i / 2.0,
            "79eb41764cc2c065de752bd704asdf4aa." + i + "." + i * i,
            "79eb41764cc2c065de752bd704bfc4aa." + i + "." + i * i + 3,
          ]
        } )
      }

      let hashes = await createObjects( stream.id, userOne.id, objs2 )
      hashes.forEach( ( h, i ) => objs2[ i ].hash = h )
      expect( hashes ).to.have.lengthOf( objCount_2 )
    } ).timeout( 30000 )

    it( 'Should get a single object', async ( ) => {

      let obj = await getObject( sampleCommit.hash )
      expect( obj ).to.deep.equal( sampleCommit )
    } )

    it( 'Should get more objects', async ( ) => {
      let myObjs = await getObjects( objs.map( o => o.hash ) )
      expect( myObjs ).to.have.lengthOf( objs.length )

      let match1 = myObjs.find( o => o.hash === objs[ 0 ].hash )
      expect( match1 ).to.not.be.null
      expect( match1.hash ).to.equal( objs[ 0 ].hash )

      let match2 = myObjs.find( o => o.hash === objs[ 2 ].hash )
      expect( match2 ).to.not.be.null
      expect( match2.hash ).to.equal( objs[ 2 ].hash )
    } )

  } )

  describe( 'Integration (API)', ( ) => {

    // The express app
    let app = null

    before( async ( ) => {
      app = init( )
    } )

    it( 'Should create an object', async ( ) => {
      assert.fail( 'Not implemented yet.' )
    } )

  } )

} )