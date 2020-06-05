const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const root = require( 'app-root-path' )

const { init } = require( `${root}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${root}/db/knex` )

const { createUser, getUser, updateUser, deleteUser, validatePasssword } = require( `${root}/modules/core/services/users` )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( `${root}/modules/core/services/tokens` )

const { getApp, registerApp, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken } = require( '../services/apps' )

describe( 'Apps', ( ) => {

  let actor = {
    username: 'DimitrieStefanescu',
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
    expect( app.firstparty ).to.equal( true )
  } )

  it( 'Should get the mock app', async ( ) => {
    let app = await getApp( { id: 'mock' } )
    expect( app ).to.be.an( 'object' )
    expect( app.redirectUrl ).to.be.a( 'string' )
    expect( app.scopes ).to.be.a( 'array' )
    expect( app.firstparty ).to.equal( false )
  } )

  let myTestApp = null

  it( 'Should register an app', async ( ) => {
    let res = await registerApp( { name: 'test application', firstparty: true, author: actor.id, scopes: [ 'streams:read' ], redirectUrl: 'http://localhost:1335' } )

    expect( res ).to.have.property( 'id' )
    expect( res ).to.have.property( 'secret' )

    expect( res.id ).to.be.a( 'string' )
    expect( res.secret ).to.be.a( 'string' )
    myTestApp = res

    let app = await getApp( { id: res.id } )
    expect( app.firstparty ).to.equal( false )
    expect( app.id ).to.equal( res.id )
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


} )