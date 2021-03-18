'use strict'

const appRoot = require( 'app-root-path' )
const { createAndSendInvite } = require( `${appRoot}/modules/serverinvites/services` )
const { authorizeResolver } = require( `${appRoot}/modules/shared` )

module.exports = {
  Mutation: {

    async serverInviteCreate( parent, args, context, info ) {

      await createAndSendInvite( {
        email: args.input.email,
        inviterId: context.userId,
        message: args.input.message
      } )

      return true
    },

    async streamInviteCreate( parent, args, context, info ) {

      await authorizeResolver( context.userId, args.input.streamId, 'stream:owner' )

      await createAndSendInvite( {
        email: args.input.email,
        inviterId: context.userId,
        message: args.input.message,
        resourceTarget: 'streams',
        resourceId: args.input.streamId,
        role: 'stream:contributor'
      } )

      return true
    }

  }
}
