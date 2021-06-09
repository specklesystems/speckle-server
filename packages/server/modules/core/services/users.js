'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Users = ( ) => knex( 'users' )
const Acl = ( ) => knex( 'server_acl' )

const debug = require( 'debug' )
const { deleteStream } = require( './streams' )

module.exports = {

  /*

        Users

  */

  async createUser( user ) {
    let [ { count } ] = await Acl( ).where( { role: 'server:admin' } ).count( )

    user.id = crs( { length: 10 } )

    if ( user.password ) {
      if ( user.password.length < 8 ) throw new Error( 'Password to short; needs to be 8 characters or longer.' )
      user.passwordDigest = await bcrypt.hash( user.password, 10 )
    }
    delete user.password

    let usr = await Users( ).select( 'id' ).where( { email: user.email } ).first( )
    if ( usr ) throw new Error( 'Email taken. Try logging in?' )

    let res = await Users( ).returning( 'id' ).insert( user )

    if ( parseInt( count ) === 0 ) {
      await Acl( ).insert( { userId: res[ 0 ], role: 'server:admin' } )
    } else {
      await Acl( ).insert( { userId: res[ 0 ], role: 'server:user' } )
    }

    return res[ 0 ]
  },

  async findOrCreateUser( { user, rawProfile } ) {
    let existingUser = await Users( ).select( 'id' ).where( { email: user.email } ).first( )

    if ( existingUser ) {

      if ( user.suuid ) {
        await module.exports.updateUser( existingUser.id, { suuid: user.suuid } )
      }

      existingUser.suuid = user.suuid
      return existingUser
    }

    user.password = crs( { length: 20 } )
    user.verified = true // because we trust the external identity provider, no?
    return { id: await module.exports.createUser( user ), email: user.email }
  },

  async getUserById( { userId } ) {
    let user = await Users( ).where( { id: userId } ).select( '*' ).first( )
    if ( user ) 
      delete user.passwordDigest
    return user
  },

  // TODO: deprecate
  async getUser( id ) {
    let user = await Users( ).where( { id: id } ).select( '*' ).first( )
    if ( user ) 
      delete user.passwordDigest
    return user
  },

  async getUserByEmail( { email } ) {
    let user = await Users( ).where( { email: email } ).select( '*' ).first( )
    if ( !user ) return null
    delete user.passwordDigest
    return user
  },

  async getUserRole( id ) {
    let { role } = await Acl( ).where( { userId: id } ).select( 'role' ).first( )
    return role
  },

  async updateUser( id, user ) {
    delete user.id
    delete user.passwordDigest
    delete user.password
    delete user.email
    await Users( ).where( { id: id } ).update( user )
  },

  async updateUserPassword( { id, newPassword } ) {
    if ( newPassword.length < 8 ) throw new Error( 'Password to short; needs to be 8 characters or longer.' )
    let passwordDigest = await bcrypt.hash( newPassword, 10 )
    await Users().where( { id:id } ).update( { passwordDigest } )
  },

  async searchUsers( searchQuery, limit, cursor ) {
    limit = limit || 25

    let query = Users( )
      .select( 'id', 'name', 'bio', 'company', 'verified', 'avatar', 'createdAt' )
      .where( queryBuilder => {
        queryBuilder.where( { email: searchQuery } ) //match full email or partial name
        queryBuilder.orWhere( 'name', 'ILIKE', `%${searchQuery}%` )
      } )

    if ( cursor )
      query.andWhere( 'users.createdAt', '<', cursor )

    query.orderBy( 'users.createdAt', 'desc' ).limit( limit )

    let rows = await query
    return { users: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].createdAt.toISOString( ) : null }
  },

  async validatePasssword( { email, password } ) {
    let { passwordDigest } = await Users( ).where( { email: email } ).select( 'passwordDigest' ).first( )
    return bcrypt.compare( password, passwordDigest )
  },

  async deleteUser( id ) {
    debug( 'speckle:db' )( 'Deleting user ' + id )
    let streams = await knex.raw(
      `
      -- Get the stream ids with only this user as owner
      SELECT "resourceId" as id
      FROM (
        -- Compute (streamId, ownerCount) table for streams on which the user is owner
        SELECT acl."resourceId", count(*) as cnt
        FROM stream_acl acl
        INNER JOIN 
          (
          -- Get streams ids on which the user is owner
          SELECT "resourceId" FROM stream_acl
          WHERE role = 'stream:owner' AND "userId" = ?
          ) AS us ON acl."resourceId" = us."resourceId"
        WHERE acl.role = 'stream:owner'
        GROUP BY (acl."resourceId")
      ) AS soc
      WHERE cnt = 1
      `,
      [ id ]
    )
    for ( let i in streams.rows ) {
      await deleteStream( { streamId: streams.rows[i].id } )
    }
    
    return await Users( ).where( { id: id } ).del( )
  }
}
