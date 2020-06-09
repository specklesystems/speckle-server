'use strict'
const passport = require( 'passport' )
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy
const URL = require( 'url' ).URL
const root = require( 'app-root-path' )
const { createUser, findOrCreateUser, validatePasssword, getUserByEmail } = require( `${root}/modules/core/services/users` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( '../services/apps' )

module.exports = ( app, session, sessionAppId, finalizeAuth ) => {

  const strategy = {
    id: 'local',
    name: 'Local',
    icon: 'TODO',
    color: 'accent',
    url: `/auth/local`
  }

  app.post( '/auth/local/login', session, sessionAppId, async ( req, res, next ) => {
    let valid = await validatePasssword( { email: req.body.email, password: req.body.password } )
    if ( !valid ) {
      return res.status( 401 ).send( { err: true, message: 'Invalid credentials' } )
    }
    let user = await getUserByEmail( { email: req.body.email } )
    req.user = { id: user.id }
    next( )
  }, finalizeAuth )

  app.post( '/auth/local/register', session, sessionAppId, async ( req, res, next ) => {
    try {
      let userId = await createUser( req.body )
      req.user = { id: userId }
      return next( )
    } catch ( err ) {
      return res.status( 400 ).send( { err: err.message } )
    }
  }, finalizeAuth )

  return strategy
}