// /* istanbul ignore file */
exports.up = async ( knex ) => {
  await knex.schema.createTable( 'comments', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'authorId', 10 ).references( 'id' ).inTable( 'users' ).notNullable().index( )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.timestamp( 'updatedAt' ).defaultTo( knex.fn.now( ) )
    table.string( 'text' )
    table.jsonb( 'data' )
    table.boolean( 'archived' ).defaultTo( false ).notNullable()
    table.string( 'parentComment', 10 ).references( 'id' ).inTable( 'comments' ).defaultTo( null )
  } )

  // Comments >- -< Stream or Commit or Object or Comment
  await knex.schema.createTable( 'comment_links', table => {
    table.string( 'commentId', 10 ).references( 'id' ).inTable( 'comments' ).onDelete( 'cascade' )
    //foreign keys are not enforced cause of the multiple table that can be referenced
    table.string( 'resourceId' ).notNullable()
    table.string( 'resourceType' ).notNullable().checkIn( [ 'stream', 'commit', 'object', 'comment' ] )
  } )
}

exports.down = async ( knex ) => {
  await knex.schema.dropTableIfExists( 'comment_links' )
  await knex.schema.dropTableIfExists( 'comments' )
}