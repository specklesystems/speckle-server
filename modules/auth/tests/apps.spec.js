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

const { createUser, getUser, updateUser, deleteUser, validatePasssword } = require( `${appRoot}/modules/core/services/users` )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( `${appRoot}/modules/core/services/tokens` )

const { getApp, createApp, updateApp, deleteApp, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken, revokeExistingAppCredentialsForUser } = require( '../services/apps' )

describe( 'Apps', ( ) => {

  describe( 'Services @apps-services', ( ) => {
    let actor = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie@gmail.com',
      password: 'wtfwtfwtf'
    }

    before( async ( ) => {
      await knex.migrate.rollback( )
      await knex.migrate.latest( )
      actor.id = await createUser( actor )
    } )

    after( async ( ) => {

    } )

    it( 'Should get the frontend main app', async ( ) => {
      let app = await getApp( { id: 'spklwebapp' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    it( 'Should get the mock app', async ( ) => {
      let app = await getApp( { id: 'mock' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    let myTestApp = null

    it( 'Should register an app', async ( ) => {
      let res = await createApp( { name: 'test application', scopes: [ 'streams:read' ], redirectUrl: 'http://localhost:1335' } )

      expect( res ).to.have.property( 'id' )
      expect( res ).to.have.property( 'secret' )

      expect( res.id ).to.be.a( 'string' )
      expect( res.secret ).to.be.a( 'string' )

      let app = await getApp( { id: res.id } )
      expect( app.id ).to.equal( res.id )
      myTestApp = app
    } )

    it( 'Should fail to register an app with no scopes', async ( ) => {
      try {
        let res = await createApp( { name: 'test application2', redirectUrl: 'http://localhost:1335' } )
        assert.fail( )
      } catch ( e ) {
        // pass
      }
    } )

    it( 'Should update an app', async ( ) => {
      let res = await updateApp( { app: { name: 'updated test application', id: myTestApp.id, scopes: [ 'streams:read', 'users:read' ] } } )
      expect( res ).to.be.a( 'string' )

      let app = await getApp( { id: myTestApp.id } )
      expect( app.name ).to.equal( 'updated test application' )
      expect( app.scopes ).to.be.an( 'array' )
      expect( app.scopes.map( s => s.name ) ).to.include( 'users:read' )
      expect( app.scopes.map( s => s.name ) ).to.include( 'streams:read' )
    } )

    let challenge = 'random'
    let authorizationCode = null
    it( 'Should get an authorization code for the app', async ( ) => {
      authorizationCode = await createAuthorizationCode( { appId: myTestApp.id, userId: actor.id, challenge } )
      expect( authorizationCode ).to.be.a( 'string' )
    } )

    let tokenCreateResponse = null
    it( 'Should get an api token in exchange for the authorization code ', async ( ) => {
      let response = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: authorizationCode, challenge: 'random' } )
      expect( response ).to.have.property( 'token' )
      expect( response.token ).to.be.a( 'string' )
      expect( response ).to.have.property( 'refreshToken' )
      expect( response.refreshToken ).to.be.a( 'string' )

      tokenCreateResponse = response

      let validation = await validateToken( response.token )
      expect( validation.valid ).to.equal( true )
      expect( validation.userId ).to.equal( actor.id )
      expect( validation.scopes[ 0 ] ).to.equal( 'streams:read' )
    } )

    it( 'Should refresh the token using the refresh token, and get a fresh refresh token and token', async ( ) => {
      let res = await refreshAppToken( { refreshToken: tokenCreateResponse.refreshToken, appId: myTestApp.id, appSecret: myTestApp.secret, userId: actor.id } )

      expect( res.token ).to.be.a( 'string' )
      expect( res.refreshToken ).to.be.a( 'string' )

      let validation = await validateToken( res.token )
      expect( validation.valid ).to.equal( true )
      expect( validation.userId ).to.equal( actor.id )
    } )

    it( 'Should invalidate all tokens, refresh tokens and access codes for an app if it is updated', async ( ) => {
      let unusedAccessCode = await createAuthorizationCode( { appId: myTestApp.id, userId: actor.id, challenge } )
      let usedAccessCode = await createAuthorizationCode( { appId: myTestApp.id, userId: actor.id, challenge } )
      let apiTokenResponse = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: usedAccessCode, challenge: challenge } )

      // We now have one unused acces code, an api token and a refresh token.
      // Proceed to update the app:
      let res = await updateApp( { app: { name: 'updated test application', id: myTestApp.id, scopes: [ 'streams:write', 'users:read' ] } } )

      let validationResponse = await validateToken( apiTokenResponse.token )
      expect( validationResponse.valid ).to.equal( false )

      try {
        let refresh = await refreshAppToken( { refreshToken: apiTokenResponse.refreshToken, appId: myTestApp.id, appSecret: myTestApp.secret } )
        assert.fail( 'Should not be able to refresh token' )
      } catch ( e ) {
        // Pass
      }

      try {
        let token = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: unusedAccessCode, challenge: 'random' } )
        assert.fail( 'Should not be able to generate new token using old access code' )
      } catch ( e ) {
        // Pass
      }

    } )

    it( 'Should revoke access for a given user', async ( ) => {
      let secondUser = {
        name: 'Dimitrie Stefanescu',
        email: 'didimitrie.wow@gmail.com',
        password: 'wtfwtfwtf'
      }

      secondUser.id = await createUser( secondUser )
      let accesCode = await createAuthorizationCode( { appId: myTestApp.id, userId: secondUser.id, challenge } )
      let apiTokenResponse = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: accesCode, challenge: challenge } )

      let res = await revokeExistingAppCredentialsForUser( { appId: myTestApp.id, userId: secondUser.id } )

      try {
        let refresh = await refreshAppToken( { refreshToken: apiTokenResponse.refreshToken, appId: myTestApp.id, appSecret: myTestApp.secret } )
        assert.fail( 'Should not be able to refresh token' )
      } catch ( e ) {
        // Pass
      }

      try {
        let token = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: unusedAccessCode, challenge: 'random' } )
        assert.fail( 'Should not be able to generate new token using old access code' )
      } catch ( e ) {
        // Pass
      }

    } )

    it( 'Should delete an app', async ( ) => {
      let res = await deleteApp( { id: myTestApp.id } )
      expect( res ).to.equal( 1 )
    } )

  } )

  describe( 'GraphQL @apps-api', ( ) => {

    let testServer
    let testUser

    before( async ( ) => {

      await knex.migrate.rollback( )
      await knex.migrate.latest( )

      let { app } = await init( )
      let { server } = await startHttp( app )
      testServer = server

      testUser = {
        name: 'Dimitrie Stefanescu',
        email: 'didimitrie@gmail.com',
        password: 'wtfwtfwtf'
      }

      testUser.id = await createUser( testUser )

    } )

    after( async ( ) => {

      testServer.close( )

    } )

    it( 'Should create an app', async ( ) => {

    } )

    it( 'Should get app info', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should get app info without secret if not authenticated, owner or admin', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should update app info', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should delete app', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should get my authorised apps', async ( ) => {
      assert.fail( 'todo' )
    } )

    it( 'Should get the apps that i have created', async ( ) => {

    } )


  } )
} )
