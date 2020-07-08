const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init, startHttp } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

describe( `Upload/Download Routes`, ( ) => {

  let userA = { name: 'd1', username: 'd1', email: 'd.1@speckle.systems', password: 'wow' }

  let testServer
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let { app } = await init( )
    let { server } = await startHttp( app )
    testServer = server
  } )

  after( async ( ) => {
    testServer.close( )
  } )

  it( 'Should not allow upload requests without an authorization token', async ( ) => {
    assert.fail()
  } )

  it( 'Should not allow download requests without an authorization token', async ( ) => {
    assert.fail()
  } )

  it( 'Should not allow upload requests with a bogus stream id', async ( ) => {
    assert.fail()
  } )

  it( 'Should not allow download requests with a bogus stream id', async ( ) => {
    assert.fail()
  } )

  it( 'Should properly upload a bunch of objects', async ( ) => {
    // this is gonna be a difficult test to write...
    assert.fail()
  } )

  it( 'Should properly download an object, with all its children', async ( ) => {
    // this is gonna be a difficult test to write...
    assert.fail()
  } )

} )