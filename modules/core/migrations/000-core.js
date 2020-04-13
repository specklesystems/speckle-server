'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' )
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "ltree"' )

  await knex.schema.createTable( 'users', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'username', 20 ).unique( ).notNullable( )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.string( 'name' ).notNullable( )
    table.string( 'email' ).unique( )
    table.jsonb( 'profiles' )
    table.text( 'password_digest' ) // bcrypted pwd
    table.bool( 'verified' ).defaultTo( false )
  } )

  // Api tokens. TODO: add moar comments
  await knex.schema.createTable( 'api_tokens', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'token_digest' ).unique( )
    table.string( 'owner_id', 10 ).references( 'id' ).inTable( 'users' ).notNullable( )
    table.string( 'name' )
    table.string( 'last_chars', 6 )
    table.specificType( 'scopes', 'text[]' )
    table.boolean( 'revoked' ).defaultTo( false )
    table.bigint( 'lifespan' ).defaultTo( 3.154e+12 ) // defaults to a lifespan of 100 years
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'last_used' ).defaultTo( knex.fn.now( ) )
  } )

  // Streams Table
  await knex.schema.createTable( 'streams', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'name' )
    table.text( 'description' )
    table.boolean( 'isPublic' ).defaultTo( true )
    table.string( 'cloned_from', 10 ).references( 'id' ).inTable( 'streams' )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updated_at' ).defaultTo( knex.fn.now( ) )
    // table.unique( [ 'owner_id', 'name' ] )
  } )

  // creates an enum type for stream acl roles.
  await knex.raw( `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'speckle_acl_role_type') THEN
        CREATE TYPE speckle_acl_role_type AS ENUM( 'owner', 'admin', 'write', 'read' );
      END IF;
    END$$;
    ` )

  // Stream-users access control list.
  await knex.schema.createTable( 'stream_acl', table => {
    table.string( 'user_id', 10 ).references( 'id' ).inTable( 'users' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'resource_id', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.primary( [ 'user_id', 'resource_id' ] )
    table.unique( [ 'user_id', 'resource_id' ] )
    table.specificType( 'role', 'speckle_acl_role_type' ).defaultTo( 'write' )
  } )

  // Objects Table
  await knex.schema.createTable( 'objects', table => {
    table.string( 'hash' ).primary( )
    table.string( 'speckle_type' ).defaultTo( 'Base' ).notNullable( )
    table.string( 'applicationId' )
    table.jsonb( 'data' )
    table.string( 'author', 10 ).references( 'id' ).inTable( 'users' )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.index( [ 'speckle_type' ], 'type_index' )
  } )

  // Tree inheritance tracker
  await knex.schema.createTable( 'object_tree_refs', table => {
    table.increments( 'id' )
    table.string( 'parent' )
    table.specificType( 'path', 'ltree' )
  } )

  await knex.raw( `CREATE INDEX tree_path_idx ON object_tree_refs USING gist(path)` )

  // creates an enum type for db reference types (branch, tag).
  await knex.raw( `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'speckle_reference_type') THEN
        CREATE TYPE speckle_reference_type AS ENUM( 'branch', 'tag' );
      END IF;
    END$$;
    ` )

  // Reference table. A reference can be a branch or a tag.
  await knex.schema.createTable( 'references', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'stream_id', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'author', 10 ).references( 'id' ).inTable( 'users' )
    table.string( 'name' )
    table.specificType( 'type', 'speckle_reference_type' ).defaultTo( 'branch' )
    table.text( 'description' )
    // (Sparse) Only populated for tags, which hold one commit. 
    table.string( 'commit_id' ).references( 'hash' ).inTable( 'objects' )
    table.timestamp( 'created_at' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updatedAt' ).defaultTo( knex.fn.now( ) )
    table.unique( [ 'stream_id', 'name' ] )
  } )

  // Junction Table Branches >- -< Commits 
  // Note: Branches >- -< Commits is a many-to-many relationship (one commit can belong to multiple branches, one branch can have multiple commits) 
  await knex.schema.createTable( 'branch_commits', table => {
    table.string( 'branch_id', 10 ).references( 'id' ).inTable( 'references' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'commit_id' ).references( 'hash' ).inTable( 'objects' ).notNullable( )
    table.primary( [ 'branch_id', 'commit_id' ] )
  } )

  // Flat table to store all commits to this stream, regardless of branch.
  // Optional, might be removed as you can get all the commits from each branch...
  await knex.schema.createTable( 'stream_commits', table => {
    table.string( 'stream_id', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'commit_id' ).references( 'hash' ).inTable( 'objects' ).notNullable( )
    table.primary( [ 'stream_id', 'commit_id' ] )
  } )

}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'stream_acl' )
  await knex.schema.dropTableIfExists( 'stream_commits' )
  await knex.schema.dropTableIfExists( 'branch_commits' )
  await knex.schema.dropTableIfExists( 'user_commits' )
  await knex.schema.dropTableIfExists( 'references' )
  await knex.schema.dropTableIfExists( 'object_tree_refs' )
  await knex.schema.dropTableIfExists( 'objects' )
  await knex.schema.dropTableIfExists( 'streams' )
  await knex.schema.dropTableIfExists( 'api_tokens' )
  await knex.schema.dropTableIfExists( 'users' )
  await knex.raw( `DROP TYPE IF EXISTS speckle_reference_type ` )
  await knex.raw( `DROP TYPE IF EXISTS speckle_acl_role_type ` )
}