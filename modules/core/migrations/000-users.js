'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' )

  await knex.schema.createTable( 'users', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( ).primary( )
    table.text( 'username' ).unique( ).notNullable( )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.text( 'name' ).notNullable( )
    table.text( 'email' ).unique( )
    table.jsonb( 'profiles' )
    table.text( 'password_digest' )
    table.bool( 'verified' ).defaultTo( false )
  } )

  await knex.schema.createTable( 'api_token', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( )
    table.string( 'token_digest' ).unique( ).primary( )
    table.uuid( 'owner_id' ).references( 'id' ).inTable( 'users' ).notNullable( )
    table.text( 'name' )
    table.boolean( 'revoked' ).defaultTo( false )
    table.text( 'revoke_reason' )
  } )


}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'api_token' )
  await knex.schema.dropTableIfExists( 'users' )
}