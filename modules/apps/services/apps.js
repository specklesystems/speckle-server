'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const { createToken, createBareToken } = require( `${root}/modules/core/services/tokens` )
const ApiTokens = ( ) => knex( 'api_tokens' )
const ServerApps = ( ) => knex( 'server_apps' )
const ServerAppsScopes = ( ) => knex( 'server_apps_scopes' )
const ServerAppsTokens = ( ) => knex( 'user_server_app_tokens' )
const Scopes = ( ) => knex( 'scopes' )

const AuthorizationCodes = ( ) => knex( 'authorization_codes' )
const RefreshTokens = ( ) => knex( 'refresh_tokens' )

let allScopes = null

module.exports = {
  async getApp( { id } ) {
    if ( allScopes === null ) allScopes = await Scopes( ).select( '*' )

    let app = await ServerApps( ).select( '*' ).where( { id: id } ).first( )
    let appScopeNames = ( await ServerAppsScopes( ).select( 'scopeName' ).where( { appId: id } ) ).map( s => s.scopeName )

    app.scopes = allScopes.filter( scope => appScopeNames.indexOf( scope.name ) !== -1 )
    return app
  },

  async registerApp( app ) {
    app.id = crs( { length: 10 } )
    app.secret = crs( { length: 10 } )

    let scopes = [ ...app.scopes ]
    delete app.scopes
    delete app.firstparty

    await ServerApps( ).insert( app )
    await ServerAppsScopes( ).insert( scopes.map( s => ( { appId: app.id, scopeName: s } ) ) )
    return { id: app.id, secret: app.secret }
  },

  async createAuthorizationCode( { appId, userId, challenge } ) {
    let ac = {
      id: crs( { length: 42 } ),
      appId: appId,
      userId: userId,
      challenge: challenge
    }

    await AuthorizationCodes( ).insert( ac )
    return ac.id
  },

  async createAppTokenFromAccessCode( { appId, appSecret, accessCode, challenge } ) {
    let code = await AuthorizationCodes( ).select( ).where( { id: accessCode } ).first( )

    const timeDiff = Math.abs( Date.now( ) - new Date( code.createdAt ) )
    if ( timeDiff > code.lifespan ) {
      await AuthorizationCodes( ).where( { id: accessCode } ).del( )
      throw new Error( 'Access code expired' )
    }

    if ( code.challenge !== challenge ) throw new Error( 'Invalid request' )

    let app = await ServerApps( ).select( '*' ).where( { id: appId } ).first( )

    if ( !app ) throw new Error( 'Invalid app' )
    if ( app.secret !== appSecret ) throw new Error( 'Invalid app credentials' )

    const scopes = await ServerAppsScopes( ).select( 'scopeName' ).where( { appId: appId } )

    const appScopes = scopes.map( s => s.scopeName )

    const { token: appToken } = await createToken( { userId: code.userId, name: `${app.name}-token`, /* lifespan: 1.21e+9, */ scopes: appScopes } )

    await ServerAppsTokens( ).insert( { userId: code.userId, tokenId: appToken.slice( 0, 10 ), appId: appId } )

    let bareToken = await createBareToken( )


    let refreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId: app.id,
      userId: code.userId
    }

    const rtk = await RefreshTokens( ).insert( refreshToken )

    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  },

  async refreshAppToken( { refreshToken, appId, appSecret, userId } ) {
    let refreshTokenId = refreshToken.slice( 0, 10 )
    let refreshTokenContent = refreshToken.slice( 10, 42 )

    let refreshTokenDb = await RefreshTokens( ).select( '*' ).where( { id: refreshTokenId } ).first( )

    if ( !refreshTokenDb )
      throw new Error( 'Invalid request' )

    if ( refreshTokenDb.appId !== appId )
      throw new Error( 'Invalid request' )

    if ( refreshTokenDb.userId !== userId )
      throw new Error( 'Invalid request' )

    const timeDiff = Math.abs( Date.now( ) - new Date( refreshTokenDb.createdAt ) )
    if ( timeDiff > refreshTokenDb.lifespan ) {
      await RefreshTokens( ).where( { id: refreshTokenId } ).del( )
      throw new Error( 'Refresh token expired' )
    }

    let valid = await bcrypt.compare( refreshTokenContent, refreshTokenDb.tokenDigest )
    if ( !valid )
      throw new Error( 'Invalid token' ) // sneky hackstors

    let app = await module.exports.getApp( { id: appId } )
    if ( app.secret !== appSecret )
      throw new Error( 'Invalid request' )

    // Create the new token
    const { token: appToken } = await createToken( { userId: userId, name: `${app.name}-token`, /* lifespan: 1.21e+9, */ scopes: app.scopes.map( s => s.name ) } )

    // Delete previous token, if it exists
    let previousToken = await ServerAppsTokens( ).select( 'tokenId' ).where( { appId: appId, userId: userId } ).first( )
    if ( previousToken )
      await ApiTokens( ).where( { id: previousToken.tokenId } ).del( )

    await ServerAppsTokens( ).insert( { userId: userId, tokenId: appToken.slice( 0, 10 ), appId: appId } )

    // Create a new refresh token
    let bareToken = await createBareToken( )

    let freshRefreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId: appId,
      userId: userId
    }

    const rtk = await RefreshTokens( ).insert( freshRefreshToken )

    // Finally return
    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  }
}