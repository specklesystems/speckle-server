'use strict'

const users = require( 'express' ).Router( { mergeParams: true } )

module.exports = users

users.get( '/users/:userId', ( ) => { res.send( 'todo' ) } )

// TODO: Disable if local authentication is moot
users.post( '/users/:userId', ( ) => { res.send( 'todo' ) } )

users.put( '/users/:userId', ( ) => { res.send( 'todo' ) } )