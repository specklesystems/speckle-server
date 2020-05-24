const knex = require( './db/knex' )
const ServerRoles = ( ) => knex( 'server_acl' )
const ServerConf = ( ) => knex( 'server_config' )

module.exports = async ( ) => {
  let [ { count } ] = await ServerRoles( ).where( { role: 'server:admin' } ).count( )
  if ( parseInt( count ) === 0 ) return false

  let conf = ServerConf( ).select( '*' ).first( )
  if ( !conf ) return false

  return true
}