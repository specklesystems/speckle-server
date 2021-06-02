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
const { createPersonalAccessToken, validateToken } = require( `${appRoot}/modules/core/services/tokens` )

const { getApp, getAllPublicApps, createApp, updateApp, deleteApp, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken, revokeExistingAppCredentialsForUser } = require( '../services/apps' )

const serverAddress = `http://localhost:${process.env.PORT || 3000}`

describe( 'Apps @apps', ( ) => {

  describe( 'Services @apps-services', ( ) => {
    let actor = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie@gmail.com',
      password: 'wtfwtfwtf'
    }

    before( async ( ) => {
      // await knex.migrate.rollback( )
      // await knex.migrate.latest( )

      await init()

      actor.id = await createUser( actor )
    } )

    after( async ( ) => {
      await knex.migrate.rollback( )
    } )

    it( 'Should get the frontend main app', async ( ) => {
      let app = await getApp( { id: 'spklwebapp' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    it( 'Should get the desktop manager app', async ( ) => {
      let app = await getApp( { id: 'sdm' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    it( 'Should get the explorer app', async ( ) => {
      let app = await getApp( { id: 'explorer' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    it( 'Should get the excel app', async ( ) => {
      let app = await getApp( { id: 'spklexcel' } )
      expect( app ).to.be.an( 'object' )
      expect( app.redirectUrl ).to.be.a( 'string' )
      expect( app.scopes ).to.be.a( 'array' )
    } )

    let myTestApp = null

    it( 'Should register an app', async ( ) => {
      const res = await createApp( { name: 'test application', public: true, scopes: [ 'streams:read' ], redirectUrl: 'http://localhost:1335' } )

      expect( res ).to.have.property( 'id' )
      expect( res ).to.have.property( 'secret' )

      expect( res.id ).to.be.a( 'string' )
      expect( res.secret ).to.be.a( 'string' )

      let app = await getApp( { id: res.id } )
      expect( app.id ).to.equal( res.id )
      myTestApp = app
    } )

    it( 'Should get all the public apps on this server', async ( ) => {
      let apps = await getAllPublicApps( )
      expect( apps ).to.be.an( 'array' )
      expect( apps.length ).to.equal( 5 )
    } )

    it( 'Should fail to register an app with no scopes', async ( ) => {
      try {
        const res = await createApp( { name: 'test application2', redirectUrl: 'http://localhost:1335' } )
        assert.fail( )
      } catch ( e ) {
        // pass
      }
    } )

    it( 'Should update an app', async ( ) => {

      const res = await updateApp( { app: { name: 'updated test application', id: myTestApp.id, scopes: [ 'streams:read', 'users:read' ] } } )
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

      const response = await createAppTokenFromAccessCode( { appId: myTestApp.id, appSecret: myTestApp.secret, accessCode: authorizationCode, challenge: 'random' } )
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

      const res = await refreshAppToken( { refreshToken: tokenCreateResponse.refreshToken, appId: myTestApp.id, appSecret: myTestApp.secret, userId: actor.id } )

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
      const res = await updateApp( { app: { name: 'updated test application', id: myTestApp.id, scopes: [ 'streams:write', 'users:read' ] } } )

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

      const res = await revokeExistingAppCredentialsForUser( { appId: myTestApp.id, userId: secondUser.id } )

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

      const res = await deleteApp( { id: myTestApp.id } )
      expect( res ).to.equal( 1 )

    } )

  } )

  describe( 'GraphQL @apps-api', ( ) => {

    let testServer
    let testUser
    let testUser2
    let testToken
    let testToken2

    before( async ( ) => {

      let { app } = await init( )
      let { server } = await startHttp( app )

      testServer = server

      testUser = {
        name: 'Dimitrie Stefanescu',
        email: 'didimitrie@gmail.com',
        password: 'wtfwtfwtf'
      }

      testUser.id = await createUser( testUser )
      testToken = `Bearer ${( await createPersonalAccessToken( testUser.id, 'test token', [ 'profile:read', 'apps:read', 'apps:write' ] ) )}`

      testUser2 = {
        name: 'Mr. Mac',
        email: 'steve@jobs.com',
        password: 'wtfwtfwtf'
      }

      testUser2.id = await createUser( testUser2 )
      testToken2 = `Bearer ${( await createPersonalAccessToken( testUser2.id, 'test token', [ 'profile:read', 'apps:read', 'apps:write' ] ) )}`


    } )

    after( async ( ) => {
      await knex.migrate.rollback( )
      testServer.close( )
    } )

    let testAppId
    let testApp

    it( 'Should create an app', async ( ) => {

      const query = 'mutation createApp($myApp:AppCreateInput!) { appCreate( app: $myApp ) } '
      const variables = { myApp: { name: 'Test App', public: true, description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }

      const res = await sendRequest( testToken, { query, variables } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      testAppId = res.body.data.appCreate

    } )


    it( 'Should not create an app if request is not authenticated', async ( ) => {

      const query = `
        mutation createApp($myApp:AppCreateInput!) {
          appCreate( app: $myApp )
        }
      `
      const variables = { myApp: { name: 'Test App', description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }

      const res = await sendRequest( null, { query, variables } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.exist

    } )

    it( 'Should get app info', async ( ) => {

      const query = `
        query getApp {
          app( id: "${testAppId}") {
            name
            secret
            description
            author {
              name
              id
            }
            scopes {
              name
              description
            }
          }
        }
      `

      const res = await sendRequest( testToken, { query } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.app.name ).to.equal( 'Test App' )
      expect( res.body.data.app.scopes.length ).to.equal( 1 )
      expect( res.body.data.app.secret ).to.exist
      testApp = res.body.data.app

    } )

    it( 'Should get all the public apps on this server', async ( ) => {

      const query = 'query allapps{ apps { name description author { id name } } }'
      const res = await sendRequest( null, { query } )
      expect( res ).to.be.json
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.apps ).to.be.an( 'array' )
      expect( res.body.data.apps.length ).to.equal( 5 )

    } )

    it( 'Should get app info without secret if not authenticated and owner', async ( ) => {

      const query = `query getApp { app( id: "${testAppId}") { name secret } }`

      const res = await sendRequest( null, { query } )
      expect( res.body.data.app.secret ).to.equal( 'App secrets are only revealed to their author 😉' )

      const res2 = await sendRequest( testToken2, { query } )
      expect( res2.body.data.app.secret ).to.equal( 'App secrets are only revealed to their author 😉' )

    } )

    it( 'Should update app info', async ( ) => {

      const query = `
        mutation updateApp($myApp:AppUpdateInput!) {
          appUpdate( app: $myApp )
        }
      `
      const variables = { myApp: { id: testAppId, name: 'Updated Test App', description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }

      const res = await sendRequest( testToken, { query, variables } )
      expect( res ).to.be.json
      expect( res.body.data.appUpdate ).to.equal( true )

      const query2 = `query getApp { app( id: "${testAppId}") { name } }`
      const res2 = await sendRequest( null, { query: query2 } )

      expect( res2.body.data.app.name ).to.equal( 'Updated Test App' )

    } )

    it( 'Should not delete app if request is not authenticated/user is app owner', async ( ) => {

      const query = `mutation del { appDelete( id: "${testAppId}" ) }`
      const res = await sendRequest( null, { query } )
      expect( res.body.errors ).to.exist

      const res2 = await sendRequest( testToken2, { query } )
      expect( res2.body.errors ).to.exist
    } )

    it( 'Should get the apps that i have created', async ( ) => {

      const query = 'mutation createApp($myApp:AppCreateInput!) { appCreate( app: $myApp ) } '
      let variables = { myApp: { name: 'Another Test App', public: false, description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }
      await sendRequest( testToken, { query, variables } )

      variables = { myApp: { name: 'The n-th Test App', public: false, description: 'Test App Description', scopes: [ 'streams:read' ], redirectUrl: 'lol://what' } }
      await sendRequest( testToken, { query, variables } )

      const getMyAppsQuery = 'query usersApps{ user { createdApps { id name description } } }'

      let res = await sendRequest( testToken, { query: getMyAppsQuery } )
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.user.createdApps ).to.be.an( 'array' )
      expect( res.body.data.user.createdApps.length ).to.equal( 3 )

    } )

    it( 'Should get my authorised apps', async ( ) => {

      // 'authorize' the test app.
      const authorizationCode_1 = await createAuthorizationCode( { appId: testAppId, userId: testUser.id, challenge: 'floating points' } )
      const response_1 = await createAppTokenFromAccessCode( { appId: testAppId, appSecret: testApp.secret, accessCode: authorizationCode_1, challenge: 'floating points' } )

      const authorizationCode_2 = await createAuthorizationCode( { appId: 'sdm', userId: testUser.id, challenge: 'floating points' } )
      const response_2 = await createAppTokenFromAccessCode( { appId: 'sdm', appSecret: 'sdm', accessCode: authorizationCode_2, challenge: 'floating points' } )


      const query = 'query myAuthApps{ user { authorizedApps { id name description termsAndConditionsLink logo author { id name } } } }'

      let res = await sendRequest( testToken, { query } )

      expect( res.body.errors ).to.not.exist
      expect( res.body.data.user.authorizedApps ).to.be.an( 'array' )
      expect( res.body.data.user.authorizedApps.length ).to.equal( 2 )

    } )

    it( 'Should revoke access to an app I have authorised', async ( ) => {

      const query = `mutation revokeAcces{ appRevokeAccess( appId: "${testAppId}" ) }`
      const res = await sendRequest( testToken, { query } )
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.appRevokeAccess ).to.equal( true )

    } )

    it( 'Should delete app', async ( ) => {

      const query = `mutation del { appDelete( appId: "${testAppId}" ) }`
      const res = await sendRequest( testToken, { query } )
      expect( res.body.errors ).to.not.exist
      expect( res.body.data.appDelete ).to.equal( true )

    } )

  } )
} )

function sendRequest( auth, obj, address = serverAddress ) {

  return chai.request( address ).post( '/graphql' ).set( 'Authorization', auth ).send( obj )

}
