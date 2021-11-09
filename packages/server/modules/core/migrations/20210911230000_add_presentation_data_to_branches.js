/* istanbul ignore file */
exports.up = async ( knex ) => {
  await knex.schema.alterTable( 'branches', table => {
    table.jsonb( 'presentationData' )
  } )
}

exports.down = async ( knex ) => {
  await knex.schema.alterTable( 'branches', table => {
    table.dropColumn( 'presentationData' )
  } )
}
