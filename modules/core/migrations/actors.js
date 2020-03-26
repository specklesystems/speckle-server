'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' )

  await knex.schema.createTable( 'actors', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( ).primary( )
    table.text( 'username' ).unique( ).notNullable( ).index( )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.text( 'name' ).notNullable( )
    table.text( 'email' ).unique( ).index( )
    table.jsonb( 'profiles' )
    table.text( 'password_digest' )
    table.bool( 'verified' ).defaultTo( false )
  } )

  await knex.schema.createTable( 'api_keys', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( ).primary( )
    table.uuid( 'owner_id' ).references( 'id' ).inTable( 'actors' ).notNullable( )
    table.text( 'name' )
    table.boolean( 'revoked' ).defaultTo( false )
    table.text( 'revoke_reason' )
  } )


}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'api_keys' )
  await knex.schema.dropTableIfExists( 'actors' )
}