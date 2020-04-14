'use strict'

const root = require( 'app-root-path' )
const { authenticate, authorize, announce } = require( `${root}/modules/shared` )

const users = require( 'express' ).Router( { mergeParams: true } )

module.exports = users

users.get( '/users/:userId', authenticate, authorize, ( ) => { res.send( 'todo' ) } )

// TODO: Disable if local authentication is moot
// users.post( '/users/:userId', authenticate, authorize, ( ) => { res.send( 'todo' ) }, announce )

// users.put( '/users/:userId', authenticate, authorize, ( ) => { res.send( 'todo' ) }, announce )