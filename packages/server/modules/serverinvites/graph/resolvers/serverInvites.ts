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
import knexInstance from '@/db/knex'
import { createServerInvitesRepository } from '../../repositories/serverInvites'
import { ServerRoles, StreamRoles } from '@speckle/shared'

export = {
  Query: {
    async streamInvite(_parent, args, context) {
      const { streamId, token } = args
      return getUserPendingStreamInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(streamId, context.userId, token)
    },
    async projectInvite(_parent, args, context) {
      const { projectId, token } = args
      return await getUserPendingStreamInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(projectId, context.userId, token)
    },
    async streamInvites(_parent, _args, context) {
      const { userId } = context
      return getUserPendingStreamInvites({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(userId!)
    },
    async serverInviteByToken(_parent, args) {
      const { token } = args
      return getServerInviteForToken({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(token)
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
      await createAndSendInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(
        {
          target: args.input.email,
          inviterId: context.userId!,
          message: args.input.message,
          serverRole: args.input.serverRole as null | undefined | ServerRoles
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
      await createStreamInviteAndNotify({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(args.input, context.userId!, context.resourceAccessRules)

      return true
    },

    async serverInviteBatchCreate(_parent, args, context) {
      const { input: paramsArray } = args

      const inviteCount = paramsArray.length
      if (inviteCount > 10 && context.role !== Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          'Maximum 10 invites can be sent at once by non admins'
        )
      }

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) =>
            createAndSendInvite({
              serverInvitesRepository: createServerInvitesRepository({
                db: knexInstance
              })
            })(
              {
                target: params.email,
                inviterId: context.userId!,
                message: params.message,
                serverRole: params.serverRole as ServerRoles | null | undefined
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
            return createAndSendInvite({
              serverInvitesRepository: createServerInvitesRepository({
                db: knexInstance
              })
            })(
              {
                target,
                inviterId: context.userId!,
                message,
                resourceTarget: ResourceTargets.Streams,
                resourceId: streamId,
                role: (role as unknown as StreamRoles) || Roles.Stream.Contributor,
                serverRole: serverRole as ServerRoles | null | undefined
              },
              context.resourceAccessRules
            )
          })
        )
      }

      return true
    },

    async streamInviteUse(_parent, args, ctx) {
      await useStreamInviteAndNotify({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(args, ctx.userId!, ctx.resourceAccessRules)
      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId, resourceAccessRules } = ctx

      await authorizeResolver(userId, streamId, Roles.Stream.Owner, resourceAccessRules)
      await cancelStreamInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(streamId, inviteId)

      return true
    },

    async inviteResend(_parent, args) {
      const { inviteId } = args

      await resendInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(inviteId)

      return true
    },

    async inviteDelete(_parent, args) {
      const { inviteId } = args

      await deleteInvite({
        serverInvitesRepository: createServerInvitesRepository({ db: knexInstance })
      })(inviteId)

      return true
    }
  }
} as Resolvers
