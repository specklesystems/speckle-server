'use strict'

// Knex table migrations
exports.up = async knex => {

  // Streams Table
  await knex.schema.createTable( 'streams', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( ).primary( )
    table.text( 'name' )
    table.text( 'description' )
    table.boolean( 'public' ).defaultTo( true )
    table.uuid( 'owner_id' ).references( 'id' ).inTable( 'actors' ).notNullable( )
    table.uuid( 'cloned_from' ).references( 'id' ).inTable( 'streams' )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.unique( [ 'owner_id', 'name' ] )
  } )

  // Objects Table
  await knex.schema.createTable( 'objects', table => {
    table.text( 'hash' ).primary( )
    table.uuid( 'applicationId' )
    table.text( 'speckle_type' ).defaultTo( 'Base' )
    table.jsonb( 'data' )
    table.index( [ 'speckle_type' ], 'type_index' )
    table.index( [ 'hash' ], 'id_index' )
  } )

  // Sets a trigger to generate the hash of objects if not present.
  // File
  let hashTriggerObjects = require( './helperFunctions' ).hashTriggerGenerator( 'objects', 'hash' )
  await knex.raw( hashTriggerObjects )

  // creates an enum type for db references.
  await knex.raw( `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'speckle_reference_type') THEN
        CREATE TYPE speckle_reference_type AS ENUM('branch', 'tag');
      END IF;
    END$$;
    ` )

  // Reference table. A reference can be a branch or a tag.
  await knex.schema.createTable( 'references', table => {
    table.uuid( 'id' ).defaultTo( knex.raw( 'gen_random_uuid()' ) ).unique( ).primary( )
    table.uuid( 'stream_id' ).references( 'id' ).inTable( 'streams' ).notNullable( )
    table.text( 'name' )
    table.specificType( 'type', 'speckle_reference_type' ).defaultTo( 'branch' )
    table.text( 'description' )
    // (Sparse) Only populated for tags, which hold one commit. 
    table.text( 'commit_id' ).references( 'hash' ).inTable( 'objects' )

    table.unique( [ 'stream_id', 'name' ] )
  } )

  // Branches can have as many commits as possible.
  await knex.schema.createTable( 'branch_commits', table => {
    table.uuid( 'branch_id' ).references( 'id' ).inTable( 'references' ).notNullable( )
    table.text( 'commit_id' ).references( 'hash' ).inTable( 'objects' ).notNullable( )
    table.primary( [ 'branch_id', 'commit_id' ] )
  } )

  // Flat table to store all commits to this stream, regardless of branch.
  // Optional, might be removed as you can get all the commits from each branch...
  await knex.schema.createTable( 'stream_commits', table => {
    table.uuid( 'stream_id' ).references( 'id' ).inTable( 'streams' ).notNullable( )
    table.text( 'commit_id' ).references( 'hash' ).inTable( 'objects' ).notNullable( )
  } )

  await knex.schema.createTable( 'user_commits', table => {
    table.uuid( 'owner_id' ).references( 'id' ).inTable( 'actors' ).notNullable( )
    table.text( 'commit_id' ).references( 'hash' ).inTable( 'objects' )
  } )
}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'stream_commits' )
  await knex.schema.dropTableIfExists( 'branch_commits' )
  await knex.schema.dropTableIfExists( 'user_commits' )
  await knex.schema.dropTableIfExists( 'references' )
  await knex.schema.dropTableIfExists( 'objects' )
  await knex.schema.dropTableIfExists( 'streams' )
  await knex.raw( `DROP TYPE IF EXISTS speckle_reference_type ` )
}