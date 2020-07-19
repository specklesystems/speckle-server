/* istanbul ignore file */
'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.up = async knex => {
  debug( 'Setting up core module scopes.' )

  let streamRoles = [ {
    name: 'stream:owner',
    description: 'Has full access, including deletion rights & access control.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 1000
  }, {
    name: 'stream:contributor',
    description: 'Can edit, push and pull.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 500
  }, {
    name: 'stream:reviewer',
    description: 'Can only view.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 100
  } ]

  await knex( 'user_roles' ).insert( streamRoles )

  let serverRoles = [ {
    name: 'server:admin',
    description: 'Has full access to the server, including all users.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 1000
  }, {
    name: 'server:user',
    description: 'Has normal access to the server.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 100
  } ]

  await knex( 'user_roles' ).insert( serverRoles )
}

exports.down = async knex => {
  await knex( 'user_roles' ).where( true ).del( )
}