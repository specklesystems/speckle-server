/* istanbul ignore file */
const chai = require( 'chai' )
const request = require( 'supertest' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect

const knex = require( `${appRoot}/db/knex` )

describe( 'Auth @auth', ( ) => {

  describe( 'Local authN @auth-local', ( ) => {
    let expressApp
    before( async ( ) => {
      await knex.migrate.rollback( )
      await knex.migrate.latest( )

      let { app } = await init( )
      expressApp = app
    } )

    after( async ( ) => {
      await knex.migrate.rollback( )
    } )

    it( 'Should register a new user', async ( ) => {
      let res =
        await request( expressApp )
        .post( `/auth/local/register` )
        .send( { email: 'spam@speckle.systems', name: 'dimitrie stefanescu', company: 'speckle', password: 'roll saving throws' } )
        .expect( 200 )

      expect( res.body.id ).to.be.a.string
    } )

    it( 'Should fail to register a new user w/o password', async ( ) => {
      let res =
        await request( expressApp )
        .post( `/auth/local/register` )
        .send( { email: 'spam@speckle.systems', name: 'dimitrie stefanescu' } )
        .expect( 400 )
    } )

    it( 'Should log in ', async ( ) => {
      let res =
        await request( expressApp )
        .post( `/auth/local/login` )
        .send( { email: 'spam@speckle.systems', password: 'roll saving throws' } )
        .expect( 200 )
    } )

    it( 'Should fail nicely to log in ', async ( ) => {
      let res =
        await request( expressApp )
        .post( `/auth/local/login` )
        .send( { email: 'spam@speckle.systems', password: 'roll saving throw' } )
        .expect( 401 )
    } )
  } )

  describe( 'Strategies List @auth-info', ( ) => {

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

    it( 'ServerInfo Query should return the auth strategies available', async ( ) => {

      const query = `query sinfo { serverInfo { authStrategies { id name icon url color } } }`
      const res = await sendRequest( null, { query } )
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.serverInfo.authStrategies ).to.be.an( 'array' )

    } )


  } )

} )

const serverAddress = `http://localhost:${process.env.PORT || 3000}`

function sendRequest( auth, obj, address = serverAddress ) {

  return chai.request( address ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )

}
