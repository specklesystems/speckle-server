/* istanbul ignore file */
'use strict'

exports.up = async ( knex ) => {
  await knex.schema.alterTable( 'server_config', table => {    
    table.boolean( 'createDefaultGlobals' ).defaultTo( false )
    table.jsonb( 'defaultGlobals' )
  } )
}

exports.down = async ( knex ) => {
  let hasColumn = await knex.schema.hasColumn( 'server_config', 'createDefaultGlobals' )
  if ( hasColumn ) {
    await knex.schema.alterTable( 'server_config', table => {      
      table.dropColumn( 'createDefaultGlobals' )
      table.dropColumn( 'defaultGlobals' )
    } )
  }
}
	