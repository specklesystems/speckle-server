// /* istanbul ignore file */
exports.up = async ( knex ) => {
  await knex.schema.createTable( 'comments', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'authorId', 10 ).references( 'id' ).inTable( 'users' ).notNullable().index( )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updatedAt' ).defaultTo( knex.fn.now( ) )
    table.string( 'text' )
    table.jsonb( 'data' )
    table.string( 'parentComment', 10 ).references( 'id' ).inTable( 'comments' ).defaultTo( null )
  } )

  // Streams >- -< Comments
  // Minor futureproofing: a comment can be written "on top of" multiple resources from multiple streams.
  await knex.schema.createTable( 'stream_comments', table => {
    table.string( 'stream', 10 ).references( 'id' ).inTable( 'streams' ).notNullable()
    table.string( 'comment', 10 ).references( 'id' ).inTable( 'comments' ).notNullable()
  } )
  
  // Commits >- -< Comments
  await knex.schema.createTable( 'commit_comments', table => {
    table.string( 'commit', 10 ).references( 'id' ).inTable( 'commits' ).notNullable()
    table.string( 'comment', 10 ).references( 'id' ).inTable( 'comments' ).notNullable()
  } )

  // Objects >- -< Comments
  await knex.schema.createTable( 'object_comments', table => {
    table.string( 'object' ) // note: not a FK because we don't enforce uniqeness to speed things up 
    table.string( 'comment', 10 ).references( 'id' ).inTable( 'comments' ).notNullable()
    table.index( [ 'object', 'comment' ] )
  } )
}

exports.down = async ( knex ) => {
  await knex.schema.dropTableIfExists( 'object_comments' )
  await knex.schema.dropTableIfExists( 'commit_comments' )
  await knex.schema.dropTableIfExists( 'stream_comments' )
  await knex.schema.dropTableIfExists( 'comment_replies' )
  await knex.schema.dropTableIfExists( 'comments' )
}