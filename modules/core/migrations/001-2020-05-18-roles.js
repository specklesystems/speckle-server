'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.up = async knex => {
  debug( 'Setting up core module scopes.' )

  let streamRoles = [ {
    name: 'owner',
    description: 'Has full access, including deletion rights & access control.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 1000
  }, {
    name: 'contributor',
    description: 'Can edit, push and pull.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 200
  }, {
    name: 'reviewer',
    description: 'Can only view.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 100
  } ]

  await knex( 'user_roles' ).insert( streamRoles )
}

exports.down = async knex => {
  await knex( 'user_roles' ).where( true ).del( )
}