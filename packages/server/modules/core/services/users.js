'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const { saveActivity } = require( `${appRoot}/modules/activitystream/services` )

const Users = ( ) => knex( 'users' )
const Acl = ( ) => knex( 'server_acl' )

const debug = require( 'debug' )
const { deleteStream } = require( './streams' )


const changeUserRole = async ( { userId, role } ) => await Acl().where( { userId: userId } ).update( { role:role } )

const countAdminUsers = async ( ) => {
  let [ { count } ] = await Acl( ).where( { role: 'server:admin' } ).count( )
  return parseInt ( count )
} 
const _ensureAtleastOneAdminRemains = async ( userId ) => {
  if ( await countAdminUsers() === 1 ){
    let currentAdmin = await Acl( ).where( { role: 'server:admin' } ).first()
    if ( currentAdmin.userId == userId ) {
      throw new Error( 'Cannot remove the last admin role from the server' )
    }
  }
}

const userByEmailQuery = email => Users( ).whereRaw( 'lower(email) = lower(?)',[ email ] )


module.exports = {

  /*

        Users

  */

  async createUser( user ) {
    user.id = crs( { length: 10 } )
    user.email = user.email.toLowerCase()

    if ( user.password ) {
      if ( user.password.length < 8 ) throw new Error( 'Password to short; needs to be 8 characters or longer.' )
      user.passwordDigest = await bcrypt.hash( user.password, 10 )
    }
    delete user.password

    let usr = await userByEmailQuery( user.email ).select( 'id' ).first( )
    if ( usr ) throw new Error( 'Email taken. Try logging in?' )

    let res = await Users( ).returning( 'id' ).insert( user )
    
    let userRole = await countAdminUsers () === 0 ? 'server:admin' : 'server:user' 

    await Acl( ).insert( { userId: res[ 0 ], role: userRole } )

    let loggedUser = { ...user }
    delete loggedUser.passwordDigest
    await saveActivity( {
      streamId: null,
      resourceType: 'user',
      resourceId: user.id,
      actionType: 'user_create',
      userId: user.id,
      info: { user: loggedUser },
      message: 'User created'
    } )

    return res[ 0 ]
  },

  async findOrCreateUser( { user, rawProfile } ) {
    let existingUser = await userByEmailQuery( user.email ).select( 'id' ).first( )

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
    let user = await userByEmailQuery( email ).select( '*' ).first( )
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
    let { passwordDigest } = await userByEmailQuery( email ).select( 'passwordDigest' ).first( )
    return bcrypt.compare( password, passwordDigest )
  },

  async deleteUser( id ) {
    //TODO: check for the last admin user to survive
    debug( 'speckle:db' )( 'Deleting user ' + id )
    await _ensureAtleastOneAdminRemains( id )
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
  },

  async getUsers ( limit = 10, offset = 0, searchQuery = null ) {
    // sanitize limit
    const maxLimit = 200
    if ( limit > maxLimit ) limit = maxLimit
  
    let query = Users ( )

    if ( searchQuery ) {
      query.where( queryBuilder => {
        queryBuilder
          .where( 'email', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'name', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'company', 'ILIKE', `%${searchQuery}%` )
      } )
    }
    let users = await query.limit( limit ).offset( offset ) 
    users.map( user => delete user.passwordDigest )
    return users
  },

  async makeUserAdmin( { userId } ){
    await changeUserRole( { userId, role:'server:admin' } )
  },

  async unmakeUserAdmin( { userId } ){
    // dont delete last admin role
    await _ensureAtleastOneAdminRemains( userId )
    await changeUserRole( { userId, role:'server:user' } )
  },

  async archiveUser( { userId } ){
    // dont change last admin to archived
    await _ensureAtleastOneAdminRemains( userId )
    await changeUserRole( { userId, role:'server:archived-user' } )
  },

  async countUsers ( searchQuery=null ){
    let query = Users()
    if ( searchQuery ) {
      query.where( queryBuilder => {
        queryBuilder
          .where( 'email', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'name', 'ILIKE', `%${searchQuery}%` )
          .orWhere( 'company', 'ILIKE', `%${searchQuery}%` )
      } )
    }
    
    let [ userCount ] = await query.count() 
    return parseInt( userCount.count )
  }
}
