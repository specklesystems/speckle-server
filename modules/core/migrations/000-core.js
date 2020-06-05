'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.raw( 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' )

  await knex.schema.createTable( 'server_config', table => {
    table.integer( 'id' ).notNullable( ).defaultTo( 0 ).index( )
    table.string( 'name' ).defaultTo( 'My Speckle Server' )
    table.string( 'company' ).defaultTo( 'Acme. Inc.' )
    table.string( 'description' ).defaultTo( 'Speckle is the open source data platform for AEC.' )
    table.string( 'adminContact' ).defaultTo( 'n/a' )
    table.string( 'termsOfService' ).defaultTo( 'n/a' )
    table.string( 'canonicalUrl' )
    table.boolean( 'completed' ).defaultTo( false )
  } )

  await knex.schema.createTable( 'users', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'username', 20 ).unique( ).notNullable( )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.string( 'name' ).notNullable( )
    table.string( 'bio' )
    table.string( 'company' )
    table.string( 'email' ).unique( )
    table.bool( 'verified' ).defaultTo( false )
    table.text( 'avatar' )
    table.jsonb( 'profiles' )
    table.text( 'passwordDigest' ) // bcrypted pwd
  } )

  // Roles
  await knex.schema.createTable( 'user_roles', table => {
    table.string( 'name' ).primary( )
    table.text( 'description' ).notNullable( )
    table.string( 'resourceTarget' ).notNullable( )
    table.string( 'aclTableName' ).notNullable( )
    table.integer( 'weight' ).defaultTo( 100 ).notNullable( )
  } )

  await knex.schema.createTable( 'server_acl', table => {
    table.string( 'userId', 10 ).references( 'id' ).inTable( 'users' ).primary( ).onDelete( 'cascade' )
    table.string( 'role' ).references( 'name' ).inTable( 'user_roles' ).notNullable( ).onDelete( 'cascade' )
  } )

  // Tokens.
  await knex.schema.createTable( 'api_tokens', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'tokenDigest' ).unique( )
    table.string( 'owner', 10 ).references( 'id' ).inTable( 'users' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'name' )
    table.string( 'lastChars', 6 )
    table.boolean( 'revoked' ).defaultTo( false )
    table.bigint( 'lifespan' ).defaultTo( 3.154e+12 ) // defaults to a lifespan of 100 years
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'lastUsed' ).defaultTo( knex.fn.now( ) )
  } )

  await knex.schema.createTable( 'personal_api_tokens', table => {
    table.string( 'tokenId' ).references( 'id' ).inTable( 'api_tokens' ).onDelete( 'cascade' )
    table.string( 'userId' ).references( 'id' ).inTable( 'users' ).onDelete( 'cascade' )
  } )

  // Registered application scopes table.
  await knex.schema.createTable( 'scopes', table => {
    table.string( 'name' ).primary( )
    table.text( 'description' ).notNullable( )
  } )

  // Token - Scopes junction table
  await knex.schema.createTable( 'token_scopes', table => {
    table.string( 'tokenId' ).references( 'id' ).inTable( 'api_tokens' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'scopeName' ).references( 'name' ).inTable( 'scopes' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.index( [ 'tokenId', 'scopeName' ], 'token_scope_combined_idx' )
  } )

  // Streams Table
  await knex.schema.createTable( 'streams', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'name' )
    table.text( 'description' )
    table.boolean( 'isPublic' ).defaultTo( true )
    table.string( 'clonedFrom', 10 ).references( 'id' ).inTable( 'streams' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updatedAt' ).defaultTo( knex.fn.now( ) )
  } )

  // Stream-users access control list.
  await knex.schema.createTable( 'stream_acl', table => {
    table.string( 'userId', 10 ).references( 'id' ).inTable( 'users' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'resourceId', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'role' ).references( 'name' ).inTable( 'user_roles' ).notNullable( ).onDelete( 'cascade' )
    table.primary( [ 'userId', 'resourceId' ] )
    table.unique( [ 'userId', 'resourceId' ] )
  } )

  // Objects Table. 
  // First class citizen properties are: 
  // id - the object's hash
  // totalChildrenCount - how many subchildren, regardless of depth, this object has
  // data - the jsonb object
  // author - commit specific field
  // description - commit specific field
  // createdAt - date of insertion
  await knex.schema.createTable( 'objects', table => {
    table.string( 'id' ).primary( )
    table.string( 'speckleType' ).defaultTo( 'Base' ).notNullable( )
    table.integer( 'totalChildrenCount' )
    table.jsonb( 'totalChildrenCountByDepth' )
    table.jsonb( 'data' )
    table.string( 'author', 10 ).references( 'id' ).inTable( 'users' )
    table.string( 'description' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
  } )

  // Closure table for tracking the relationships we care about
  await knex.schema.createTable( 'object_children_closure', table => {
    table.string( 'parent' ).notNullable( ).index( )
    table.string( 'child' ).notNullable( ).index( )
    table.integer( 'minDepth' ).defaultTo( 1 ).notNullable( ).index( )
    table.index( [ 'parent', 'child' ], 'parent_child_index' )
    table.index( [ 'parent', 'minDepth' ], 'full_pcd_index' )
  } )


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
    table.string( 'streamId', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'author', 10 ).references( 'id' ).inTable( 'users' )
    table.string( 'name' )
    table.specificType( 'type', 'speckle_reference_type' ).defaultTo( 'branch' )
    table.text( 'description' )
    // (Sparse) Only populated for tags, which hold one commit. 
    table.string( 'commitId' ).references( 'id' ).inTable( 'objects' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updatedAt' ).defaultTo( knex.fn.now( ) )
    table.unique( [ 'streamId', 'name' ] )
  } )

  // Junction Table Branches >- -< Commits 
  // Note: Branches >- -< Commits is a many-to-many relationship (one commit can belong to multiple branches, one branch can have multiple commits) 
  await knex.schema.createTable( 'branch_commits', table => {
    table.string( 'branchId', 10 ).references( 'id' ).inTable( 'references' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'commitId' ).references( 'id' ).inTable( 'objects' ).notNullable( )
    table.primary( [ 'branchId', 'commitId' ] )
  } )

  // Flat table to store all commits to this stream, regardless of branch.
  // Optional, might be removed as you can get all the commits from each branch...
  await knex.schema.createTable( 'stream_commits', table => {
    table.string( 'streamId', 10 ).references( 'id' ).inTable( 'streams' ).notNullable( ).onDelete( 'cascade' )
    table.string( 'commitId' ).references( 'id' ).inTable( 'objects' ).notNullable( )
    table.primary( [ 'streamId', 'commitId' ] )
  } )

}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'server_config' )

  await knex.schema.dropTableIfExists( 'server_acl' )
  await knex.schema.dropTableIfExists( 'stream_acl' )
  await knex.schema.dropTableIfExists( 'user_roles' )

  await knex.schema.dropTableIfExists( 'stream_commits' )
  await knex.schema.dropTableIfExists( 'branch_commits' )
  await knex.schema.dropTableIfExists( 'user_commits' )
  await knex.schema.dropTableIfExists( 'references' )
  await knex.schema.dropTableIfExists( 'object_children_closure' )

  await knex.schema.dropTableIfExists( 'objects' )
  await knex.schema.dropTableIfExists( 'streams' )

  await knex.schema.dropTableIfExists( 'token_scopes' )
  await knex.schema.dropTableIfExists( 'scopes' )
  await knex.schema.dropTableIfExists( 'personal_api_tokens' )
  await knex.schema.dropTableIfExists( 'api_tokens' )
  await knex.schema.dropTableIfExists( 'users' )

  await knex.raw( `DROP TYPE IF EXISTS speckle_reference_type ` )
  await knex.raw( `DROP TYPE IF EXISTS speckle_acl_role_type ` )
}