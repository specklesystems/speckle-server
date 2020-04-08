'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' )

  await knex.schema.createTable( 'users', table => {
    table.text( 'id' ).unique( ).primary( )
    table.text( 'username' ).unique( ).notNullable( )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.text( 'name' ).notNullable( )
    table.text( 'email' ).unique( )
    table.jsonb( 'profiles' )
    table.text( 'password_digest' )
    table.bool( 'verified' ).defaultTo( false )
  } )

  await knex.schema.createTable( 'api_token', table => {
    table.text( 'id' ).unique( ).primary( )
    table.text( 'token_digest' ).unique( )
    table.text( 'owner_id' ).references( 'id' ).inTable( 'users' ).notNullable( )
    table.text( 'name' )
    table.text( 'last_chars' )
    table.specificType( 'scopes', 'text[]' )
    table.boolean( 'revoked' ).defaultTo( false )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'last_used' ).defaultTo( knex.fn.now( ) )
  } )

}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'api_token' )
  await knex.schema.dropTableIfExists( 'users' )
}