/* istanbul ignore file */
'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.up = async knex => {
  debug( 'Setting up core module scopes.' )

  let coreModuleScopes = [
    {
      name: 'streams:read',
      description: 'Read your streams, and any associated information (branches, commits, objects).'
    },
    {
      name: 'streams:write',
      description: 'Create streams on your behalf, and any associated data (branches, commits, objects).'
    },
    {
      name: 'profile:read',
      description: 'Read your profile information (name, bio, company).'
    },
    {
      name: 'profile:email',
      description: 'Grants access to the email address you registered with.'
    },
    {
      name: 'users:read',
      description: 'Read other users\' profile on your behalf.'
    },
    {
      name: 'users:email',
      description: 'Access the emails of other users on your behalf.'
    },
    {
      name: 'server:setup',
      description: 'Edit server information. Note: only server admins will be able to use this token.'
    },
    {
      name: 'tokens:read',
      description: 'Access your api tokens.'
    },
    {
      name: 'tokens:write',
      description: 'Create and delete api tokens on your behalf.'
    } ]

  await knex( 'scopes' ).insert( coreModuleScopes )
}

exports.down = async knex => {
  await knex( 'scopes' ).where( true ).delete( )
}
