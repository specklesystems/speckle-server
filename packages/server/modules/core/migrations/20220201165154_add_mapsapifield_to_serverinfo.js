// /* istanbul ignore file */
exports.up = async ( knex ) => {
  await knex.schema.alterTable( 'server_config', table => {
    table.string( 'mapboxAPI', 1024 ).defaultTo( 'n/a' )
  } )
}

exports.down = async ( knex ) => {
  let hasColumn = await knex.schema.hasColumn( 'server_config', 'mapboxAPI' )
  if ( hasColumn ) {
    await knex.schema.alterTable( 'server_config', table => {
      table.dropColumn( 'mapboxAPI' )
    } )
  }
}