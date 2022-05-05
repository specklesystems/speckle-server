'use strict'

const { createAndSendInvite } = require('@/modules/serverinvites/services')
const { authorizeResolver } = require('@/modules/shared')

module.exports = {
  Mutation: {
    async serverInviteCreate(parent, args, context) {
      await createAndSendInvite({
        email: args.input.email,
        inviterId: context.userId,
        message: args.input.message
      })

      return true
    },

    async streamInviteCreate(parent, args, context) {
      await authorizeResolver(context.userId, args.input.streamId, 'stream:owner')

      await createAndSendInvite({
        email: args.input.email,
        inviterId: context.userId,
        message: args.input.message,
        resourceTarget: 'streams',
        resourceId: args.input.streamId,
        role: 'stream:contributor'
      })

      return true
    }
  }
}
