/* istanbul ignore file */
'use strict'

const passport = require( 'passport' )
const GithubStrategy = require( 'passport-github2' )
const URL = require( 'url' ).URL
const appRoot = require( 'app-root-path' )
const { findOrCreateUser, getUserByEmail } = require( `${appRoot}/modules/core/services/users` )
const { getServerInfo } = require( `${appRoot}/modules/core/services/generic` )
const { validateInvite } = require( `${appRoot}/modules/serverinvites/services` )

module.exports = async ( app, session, sessionStorage, finalizeAuth ) => {
  const strategy = {
    id: 'github',
    name: 'Github',
    icon: 'mdi-github',
    color: 'grey darken-3',
    url: '/auth/gh',
    callbackUrl: ( new URL( '/auth/gh/callback', process.env.CANONICAL_URL ) ).toString( )
  }

  const serverInfo = await getServerInfo()

  let myStrategy = new GithubStrategy( {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: strategy.callbackUrl,
    scope: [ 'profile', 'user:email' ],
    passReqToCallback: true
  }, async ( req, accessToken, refreshToken, profile, done ) => {
    try {
      let email = profile.emails[ 0 ].value
      let name = profile.displayName || profile.username
      let bio = profile._json.bio

      let user = { email, name, bio }

      if ( req.session.suuid )
        user.suuid = req.session.suuid

      if ( serverInfo.inviteOnly ) {
        try {
          let existingUser = getUserByEmail( { email: user.email } )
        } catch ( e ) {
          if ( !req.session.inviteId )
            throw new Error( 'This server is invite only. Please provide an invite id.' )
        }
      }

      if ( req.session.inviteId ) {
        const valid = await validateInvite( { id:req.session.inviteId, email: user.email } )
        if ( !valid )
          throw new Error( 'Invite email mismatch. Please use the original email the invite was sent to register.' )
      }

      let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
      return done( null, myUser )
    } catch ( err ) {
      debug( 'speckle:errors' )( err )
      return res.status( 400 ).send( { err: err.message } )
    }
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, sessionStorage, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ) )
  app.get( '/auth/gh/callback', session, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ), finalizeAuth )

  return strategy
}
