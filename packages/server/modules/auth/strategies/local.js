'use strict'
const passport = require( 'passport' )
const URL = require( 'url' ).URL
const appRoot = require( 'app-root-path' )
const debug = require( 'debug' )
const { createUser, updateUser, findOrCreateUser, validatePasssword, getUserByEmail } = require( `${appRoot}/modules/core/services/users` )
const { getServerInfo } = require( `${appRoot}/modules/core/services/generic` )
const { validateInvite, useInvite } = require( `${appRoot}/modules/serverinvites/services` )

module.exports = async ( app, session, sessionAppId, finalizeAuth ) => {
  const strategy = {
    id: 'local',
    name: 'Local',
    icon: 'TODO',
    color: 'accent',
    url: '/auth/local'
  }

  app.post( '/auth/local/login', session, sessionAppId, async ( req, res, next ) => {
    try {
      let valid = await validatePasssword( { email: req.body.email, password: req.body.password } )

      if ( !valid ) throw new Error( 'Invalid credentials' )

      let user = await getUserByEmail( { email: req.body.email } )
      if ( !user ) throw new Error( 'Invalid credentials' )

      if ( req.body.suuid && user.suuid !== req.body.suuid ) {
        await updateUser( user.id, { suuid: req.body.suuid } )
      }

      req.user = { id: user.id }

      next( )
    } catch ( err ){
      return res.status( 401 ).send( { err: true, message: 'Invalid credentials' } )
    }
  }, finalizeAuth )

  app.post( '/auth/local/register', session, sessionAppId, async ( req, res, next ) => {
    const serverInfo = await getServerInfo()
    try {

      if ( !req.body.password )
        throw new Error( 'Password missing' )

      let user = req.body

      if ( serverInfo.inviteOnly && !req.session.inviteId ) {
        throw new Error( 'This server is invite only. Please provide an invite id.' )
      }

      if ( req.session.inviteId ) {
        const valid = await validateInvite( { id: req.session.inviteId, email: user.email } )
        if ( !valid )
          throw new Error( 'Invite email mismatch. Please use the original email the invite was sent to register.' )

        await useInvite( { id: req.session.inviteId, email: user.email } )
      }

      let userId = await createUser( user )
      req.user = { id: userId, email: user.email }

      return next( )

    } catch ( err ) {
      debug( 'speckle:errors' )( err )
      return res.status( 400 ).send( { err: err.message } )
    }
  }, finalizeAuth )

  return strategy
}
