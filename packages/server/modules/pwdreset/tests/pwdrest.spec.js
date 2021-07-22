/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const request = require( 'supertest' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init, startHttp } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )
const ResetTokens = ( ) => knex( 'pwdreset_tokens' )

const { createUser } = require( `${appRoot}/modules/core/services/users` )

describe( 'Password reset requests @passwordresets', ( ) => {

  let userA = { name: 'd1', email: 'd@speckle.systems', password: 'wowwow8charsplease' }

  let expressApp
  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let { app } = await init( )
    expressApp = app

    userA.id = await createUser( userA )
  } )

  after( async ( ) => {
    await knex.migrate.rollback( )
  } )

  it( 'Should carefully send a password request email', async ( ) => {

    // invalid request
    await request( expressApp )
      .post( '/auth/pwdreset/request' )
      .expect( 400 )

    // non-existent user
    await request( expressApp )
      .post( '/auth/pwdreset/request' )
      .send( { email: 'doesnot@exist.here' } )
      .expect( 400 )

    // good request
    await request( expressApp )
      .post( '/auth/pwdreset/request' )
      .send( { email: 'd@speckle.systems' } )
      .expect( 200 )

    // already has expiration token, fall back
    await request( expressApp )
      .post( '/auth/pwdreset/request' )
      .send( { email: 'd@speckle.systems' } )
      .expect( 400 )
  } )

  it( 'Should reset passwords', async () => {
    let token = await ResetTokens().select().first()

    // invalid request
    await request( expressApp )
      .post( '/auth/pwdreset/finalize' )
      .expect( 400 )

    // invalid request
    await request( expressApp )
      .post( '/auth/pwdreset/finalize' )
      .send( { tokenId: 'fake' } )
      .expect( 400 )

    // should be not ok, missing pwd
    await request( expressApp )
      .post( '/auth/pwdreset/finalize' )
      .send( { tokenId: token.id } )
      .expect( 400 )

    await request( expressApp )
      .post( '/auth/pwdreset/finalize' )
      .send( { tokenId: token.id, password: '12345678' } )
      .expect( 200 )

    // token used up, should fail
    await request( expressApp )
      .post( '/auth/pwdreset/finalize' )
      .send( { tokenId: token.id, password: 'abc12345678' } )
      .expect( 400 )

  } )



} )

