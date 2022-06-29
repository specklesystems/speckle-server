'use strict'

const { Roles } = require('@/modules/core/helpers/mainConstants')
const { removePrivateFields } = require('@/modules/core/helpers/userHelper')
const { InviteCreateValidationError } = require('@/modules/serverinvites/errors')
const {
  buildUserTarget,
  ResourceTargets
} = require('@/modules/serverinvites/helpers/inviteHelper')
const {
  createAndSendInvite
} = require('@/modules/serverinvites/services/inviteCreationService')
const {
  finalizeStreamInvite,
  cancelStreamInvite,
  resendInvite,
  deleteInvite
} = require('@/modules/serverinvites/services/inviteProcessingService')
const {
  getPendingStreamCollaborator
} = require('@/modules/serverinvites/services/inviteRetrievalService')
const { authorizeResolver } = require('@/modules/shared')
const { chunk } = require('lodash')

module.exports = {
  Mutation: {
    async serverInviteCreate(_parent, args, context) {
      await createAndSendInvite({
        target: args.input.email,
        inviterId: context.userId,
        message: args.input.message
      })

      return true
    },

    async streamInviteCreate(_parent, args, context) {
      await authorizeResolver(context.userId, args.input.streamId, Roles.Stream.Owner)
      const { email, userId, message, streamId } = args.input

      if (!email && !userId) {
        throw new InviteCreateValidationError(
          'Either email or userId must be specified'
        )
      }

      const target = userId ? buildUserTarget(userId) : email
      await createAndSendInvite({
        target,
        inviterId: context.userId,
        message,
        resourceTarget: ResourceTargets.Streams,
        resourceId: streamId,
        role: Roles.Stream.Contributor
      })

      return true
    },

    async serverInviteBatchCreate(_parent, args, context) {
      const { input: paramsArray } = args

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) =>
            createAndSendInvite({
              target: params.email,
              inviterId: context.userId,
              message: params.message
            })
          )
        )
      }

      return true
    },

    async streamInviteBatchCreate(_parent, args, context) {
      const { input: paramsArray } = args

      // Validate params
      for (const params of paramsArray) {
        const { email, userId } = params
        if (!email && !userId) {
          throw new InviteCreateValidationError(
            'Either email or userId must be specified'
          )
        }
      }

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) => {
            const { email, userId, message, streamId } = params
            const target = userId ? buildUserTarget(userId) : email
            return createAndSendInvite({
              target,
              inviterId: context.userId,
              message,
              resourceTarget: ResourceTargets.Streams,
              resourceId: streamId,
              role: Roles.Stream.Contributor
            })
          })
        )
      }

      return true
    },

    async streamInviteUse(_parent, args, ctx) {
      const { accept, streamId, inviteId } = args
      const { userId } = ctx

      await finalizeStreamInvite(accept, streamId, inviteId, userId)

      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId } = ctx

      await authorizeResolver(userId, streamId, Roles.Stream.Owner)
      await cancelStreamInvite(streamId, inviteId)

      return true
    },

    async inviteResend(_parent, args) {
      const { inviteId } = args

      await resendInvite(inviteId)

      return true
    },

    async inviteDelete(_parent, args) {
      const { inviteId } = args

      await deleteInvite(inviteId)

      return true
    }
  },
  Query: {
    async streamInvite(_parent, args, context) {
      const { streamId, inviteId } = args

      return await getPendingStreamCollaborator(streamId, context.userId, inviteId)
    }
  },
  ServerInvite: {
    /**
     * @param {import('@/modules/core/services/users/adminUsersListService').ServerInviteGraphqlReturnType} parent
     * @param {Object} _args
     * @param {import('@/modules/shared/index').GraphQLContext} ctx
     * @returns
     */
    async invitedBy(parent, _args, ctx) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    }
  }
}
