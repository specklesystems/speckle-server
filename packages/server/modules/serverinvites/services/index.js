'use strict'
const appRoot = require( 'app-root-path' )
const crs = require( 'crypto-random-string' )
const knex = require( `${appRoot}/db/knex` )

const { getUserByEmail, getUserById } = require( `${appRoot}/modules/core/services/users` )

const Invites = () => knex( 'server_invites' )

module.exports = {
  async createAndSendInvite( { email, inviterId, message, resourceTarget, resourceId, role } ) {
    // check if email is already registered as a user
    let existingUser
    try {
      existingUser = await getUserByEmail( { email } )
    } catch ( e ) {}

    if ( existingUser ) throw new Error( 'This email is already associated with an account on this server!' )

    // check if email is already invited
    let existingInvite = await module.exports.getInviteByEmail( { email } )
    if ( existingInvite ) throw new Error( 'Already invited!' )

    let hasTarget = resourceTarget || resourceId || role
    if ( hasTarget ) {
      if ( !resourceTarget || !resourceId || !role ) throw new Error( 'Invalid invite resource targets' )
      // TODO: Check permissions on resource.
      // Only resource owners should be able to invite others and grant them permissions
    }

    let inviter = await getUserById( { id: inviterId } )
    let invite = {
      id: crs( { length:20 } ),
      email,
      inviterId: inviterId,
      message,
      resourceTarget,
      resourceId,
      role
    }

    // insert into table

    // send email with correct link
  },

  async getInviteById( { id } ) {
    return await Invites().where( { id } ).select( '*' ).first()
  },

  async getInviteByEmail( { email } ) {
    return await Invites().where( { email: email } ).select( '*' ).first()
  },

  async useInvite( { id } ) {
    // TODO
    // send email to inviter that their invite was accepted?
    // add the new user to the respective resource ACL
    let invite = await module.exports.getInviteById( { id } )
    if ( !invite ) throw new Error( 'Invite not found' )

    // TODO: update invite 'used' -> true
  }
}
