import { Roles } from '@/modules/core/helpers/mainConstants'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import { createAndSendInvite } from '@/modules/serverinvites/services/inviteCreationService'
import {
  createStreamInviteAndNotify,
  useStreamInviteAndNotify
} from '@/modules/serverinvites/services/management'
import {
  cancelStreamInvite,
  resendInvite,
  deleteInvite
} from '@/modules/serverinvites/services/inviteProcessingService'
import {
  getServerInviteForToken,
  getUserPendingStreamInvite,
  getUserPendingStreamInvites
} from '@/modules/serverinvites/services/inviteRetrievalService'
import { authorizeResolver } from '@/modules/shared'
import { chunk } from 'lodash'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Query: {
    async streamInvite(_parent, args, context) {
      const { streamId, token } = args
      return await getUserPendingStreamInvite(streamId, context.userId, token)
    },
    async projectInvite(_parent, args, context) {
      const { projectId, token } = args
      return await getUserPendingStreamInvite(projectId, context.userId, token)
    },
    async streamInvites(_parent, _args, context) {
      const { userId } = context
      return await getUserPendingStreamInvites(userId!)
    },
    async serverInviteByToken(_parent, args) {
      const { token } = args
      return await getServerInviteForToken(token)
    }
  },
  ServerInvite: {
    async invitedBy(parent, _args, ctx) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    }
  },
  Mutation: {
    async serverInviteCreate(_parent, args, context) {
      await createAndSendInvite(
        {
          target: args.input.email,
          inviterId: context.userId!,
          message: args.input.message,
          serverRole: args.input.serverRole
        },
        context.resourceAccessRules
      )

      return true
    },

    async streamInviteCreate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.input.streamId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )
      await createStreamInviteAndNotify(
        args.input,
        context.userId!,
        context.resourceAccessRules
      )

      return true
    },

    async serverInviteBatchCreate(_parent, args, context) {
      const { input: paramsArray } = args

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) =>
            createAndSendInvite(
              {
                target: params.email,
                inviterId: context.userId!,
                message: params.message,
                serverRole: params.serverRole
              },
              context.resourceAccessRules
            )
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
            const { email, userId, message, streamId, role, serverRole } = params
            const target = (userId ? buildUserTarget(userId) : email)!
            return createAndSendInvite(
              {
                target,
                inviterId: context.userId!,
                message,
                resourceTarget: ResourceTargets.Streams,
                resourceId: streamId,
                role: role || Roles.Stream.Contributor,
                serverRole
              },
              context.resourceAccessRules
            )
          })
        )
      }

      return true
    },

    async streamInviteUse(_parent, args, ctx) {
      await useStreamInviteAndNotify(args, ctx.userId!, ctx.resourceAccessRules)
      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId, resourceAccessRules } = ctx

      await authorizeResolver(userId, streamId, Roles.Stream.Owner, resourceAccessRules)
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
  }
} as Resolvers
