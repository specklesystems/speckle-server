// /* istanbul ignore file */
exports.up = async ( knex ) => {
  await knex.schema.createTable( 'stream_activity', table => {
    // TODO: Question: delete the stream activity when deleting a stream?
    table.string( 'streamId', 10 ).references( 'id' ).inTable( 'streams' ).onDelete( 'cascade' )
    table.timestamp( 'time' ).defaultTo( knex.fn.now( ) )
    // No foreign keys because the referenced objects may be deleted, but we want to keep their ids here in this table for future analysis
    table.string( 'resourceType' )
    table.string( 'resourceId' )
    table.string( 'actionType' )
    
    table.string( 'userId' )
    table.jsonb( 'info' )
    table.string( 'message' )
  } )
}

exports.down = async ( knex ) => {
  await knex.schema.dropTableIfExists( 'stream_activity' )
}
