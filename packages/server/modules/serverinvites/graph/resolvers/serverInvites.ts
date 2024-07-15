import { Roles } from '@/modules/core/helpers/mainConstants'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import {
  createAndSendInviteFactory,
  resendInviteEmailFactory
} from '@/modules/serverinvites/services/inviteCreationService'
import {
  createStreamInviteAndNotifyFactory,
  useStreamInviteAndNotifyFactory
} from '@/modules/serverinvites/services/management'
import {
  cancelStreamInviteFactory,
  resendInviteFactory,
  deleteInviteFactory,
  finalizeStreamInviteFactory
} from '@/modules/serverinvites/services/inviteProcessingService'
import {
  getServerInviteForTokenFactory,
  getUserPendingStreamInviteFactory,
  getUserPendingStreamInvitesFactory
} from '@/modules/serverinvites/services/inviteRetrievalService'
import { authorizeResolver } from '@/modules/shared'
import { chunk } from 'lodash'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import db from '@/db/knex'
import { ServerRoles, StreamRoles } from '@speckle/shared'
import {
  deleteInvitesByTargetFactory,
  deleteStreamInviteFactory,
  findInviteFactory,
  findResourceFactory,
  findServerInviteFactory,
  findStreamInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  queryAllUserStreamInvitesFactory,
  deleteInviteFactory as deleteInviteFromDbFactory
} from '@/modules/serverinvites/repositories/serverInvites'

export = {
  Query: {
    async streamInvite(_parent, args, context) {
      const { streamId, token } = args
      return getUserPendingStreamInviteFactory({
        findStreamInvite: findStreamInviteFactory({ db })
      })(streamId, context.userId, token)
    },
    async projectInvite(_parent, args, context) {
      const { projectId, token } = args
      return await getUserPendingStreamInviteFactory({
        findStreamInvite: findStreamInviteFactory({ db })
      })(projectId, context.userId, token)
    },
    async streamInvites(_parent, _args, context) {
      const { userId } = context
      return getUserPendingStreamInvitesFactory({
        queryAllUserStreamInvites: queryAllUserStreamInvitesFactory({
          db
        })
      })(userId!)
    },
    async serverInviteByToken(_parent, args) {
      const { token } = args
      return getServerInviteForTokenFactory({
        findServerInvite: findServerInviteFactory({ db })
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
      await createAndSendInviteFactory({
        findResource: findResourceFactory(),
        findUserByTarget: findUserByTargetFactory(),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db })
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
      await createStreamInviteAndNotifyFactory({
        createAndSendInvite: createAndSendInviteFactory({
          findResource: findResourceFactory(),
          findUserByTarget: findUserByTargetFactory(),
          insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({
            db
          })
        })
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
            createAndSendInviteFactory({
              findResource: findResourceFactory(),
              findUserByTarget: findUserByTargetFactory(),
              insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({
                db
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
            return createAndSendInviteFactory({
              findResource: findResourceFactory(),
              findUserByTarget: findUserByTargetFactory(),
              insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({
                db
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
      await useStreamInviteAndNotifyFactory({
        finalizeStreamInvite: finalizeStreamInviteFactory({
          findStreamInvite: findStreamInviteFactory({ db }),
          deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
          findResource: findResourceFactory()
        })
      })(args, ctx.userId!, ctx.resourceAccessRules)
      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId, resourceAccessRules } = ctx

      await authorizeResolver(userId, streamId, Roles.Stream.Owner, resourceAccessRules)
      await cancelStreamInviteFactory({
        findStreamInvite: findStreamInviteFactory({ db }),
        deleteStreamInvite: deleteStreamInviteFactory({ db })
      })(streamId, inviteId)

      return true
    },

    async inviteResend(_parent, args) {
      const { inviteId } = args

      await resendInviteFactory({
        findInvite: findInviteFactory({ db }),
        resendInviteEmail: resendInviteEmailFactory({
          findResource: findResourceFactory(),
          findUserByTarget: findUserByTargetFactory()
        })
      })(inviteId)

      return true
    },

    async inviteDelete(_parent, args) {
      const { inviteId } = args

      await deleteInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db })
      })(inviteId)

      return true
    }
  }
} as Resolvers
