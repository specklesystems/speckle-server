import { Roles } from '@/modules/core/helpers/mainConstants'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  createAndSendInviteFactory,
  resendInviteEmailFactory
} from '@/modules/serverinvites/services/creation'

import {
  cancelResourceInviteFactory,
  deleteInviteFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import {
  getInvitationTargetUsersFactory,
  getServerInviteForTokenFactory
} from '@/modules/serverinvites/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { chunk } from 'lodash'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import db from '@/db/knex'
import { ServerRoles } from '@speckle/shared'
import {
  deleteInvitesByTargetFactory,
  findInviteFactory,
  findServerInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteInviteFactory as deleteInviteFromDbFactory,
  queryAllUserResourceInvitesFactory,
  queryAllResourceInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import {
  createProjectInviteFactory,
  getPendingProjectCollaboratorsFactory,
  getUserPendingProjectInviteFactory,
  getUserPendingProjectInvitesFactory,
  useProjectInviteAndNotifyFactory
} from '@/modules/serverinvites/services/projectInviteManagement'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { getStream } from '@/modules/core/repositories/streams'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { ServerInviteResourceTarget } from '@/modules/serverinvites/domain/types'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import { addStreamInviteDeclinedActivity } from '@/modules/activitystream/services/streamActivity'
import { addOrUpdateStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'

const buildCreateAndSendServerOrProjectInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
      getStream
    }),
    emitServerInvitesEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      })
  })

export = {
  Query: {
    async streamInvite(_parent, args, context) {
      const { streamId, token } = args
      return getUserPendingProjectInviteFactory({
        getUser,
        findInvite: findInviteFactory({ db })
      })(streamId, context.userId, token)
    },
    async projectInvite(_parent, args, context) {
      const { projectId, token } = args
      return getUserPendingProjectInviteFactory({
        getUser,
        findInvite: findInviteFactory({ db })
      })(projectId, context.userId, token)
    },
    async streamInvites(_parent, _args, context) {
      const { userId } = context
      return getUserPendingProjectInvitesFactory({
        getUser,
        getUserResourceInvites: queryAllUserResourceInvitesFactory({ db })
      })(userId!)
    },
    async serverInviteByToken(_parent, args) {
      const { token } = args
      return getServerInviteForTokenFactory({
        findServerInvite: findServerInviteFactory({ db })
      })(token)
    }
  },
  User: {
    async projectInvites(_parent, _args, context) {
      const { userId } = context
      const getUserPendingProjectInvites = getUserPendingProjectInvitesFactory({
        getUser,
        getUserResourceInvites: queryAllUserResourceInvitesFactory({ db })
      })

      return await getUserPendingProjectInvites(userId!)
    }
  },
  Project: {
    async invitedTeam(parent) {
      const getPendingTeam = getPendingProjectCollaboratorsFactory({
        queryAllResourceInvites: queryAllResourceInvitesFactory({ db }),
        getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
      })

      return await getPendingTeam(parent.id)
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
      const createAndSendInvite = buildCreateAndSendServerOrProjectInvite()

      await createAndSendInvite(
        {
          target: args.input.email,
          inviterId: context.userId!,
          message: args.input.message,
          primaryResourceTarget: <ServerInviteResourceTarget>{
            resourceId: '',
            role: (args.input.serverRole as ServerRoles) || Roles.Server.User,
            resourceType: ServerInviteResourceType,
            primary: true
          }
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
      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite()
      })

      await createProjectInvite(
        args.input,
        context.userId!,
        context.resourceAccessRules
      )

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

      const createAndSendInvite = buildCreateAndSendServerOrProjectInvite()

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
                primaryResourceTarget: <ServerInviteResourceTarget>{
                  resourceId: '',
                  role: (params.serverRole as ServerRoles) || Roles.Server.User,
                  resourceType: ServerInviteResourceType,
                  primary: true
                }
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

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite()
      })

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) => {
            return createProjectInvite(
              params,
              context.userId!,
              context.resourceAccessRules
            )
          })
        )
      }

      return true
    },

    async streamInviteUse(_parent, args, ctx) {
      const useProjectInvite = useProjectInviteAndNotifyFactory({
        finalizeInvite: finalizeResourceInviteFactory({
          findInvite: findInviteFactory({ db }),
          validateInvite: validateProjectInviteBeforeFinalizationFactory({
            getProject: getStream
          }),
          processInvite: processFinalizedProjectInviteFactory({
            getProject: getStream,
            addInviteDeclinedActivity: addStreamInviteDeclinedActivity,
            addProjectRole: addOrUpdateStreamCollaborator
          }),
          deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
          insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
          emitServerInvitesEvent: (...args) => getEventBus().emit(...args)
        })
      })

      await useProjectInvite(args, ctx.userId!, ctx.resourceAccessRules)
      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId, resourceAccessRules } = ctx

      const cancelInvite = cancelResourceInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db }),
        validateResourceAccess: validateProjectInviteBeforeFinalizationFactory({
          getProject: getStream
        })
      })

      await authorizeResolver(userId, streamId, Roles.Stream.Owner, resourceAccessRules)
      await cancelInvite({
        inviteId,
        resourceId: streamId,
        resourceType: ProjectInviteResourceType,
        cancelerId: userId!,
        cancelerResourceAccessLimits: resourceAccessRules
      })

      return true
    },

    async inviteResend(_parent, args) {
      const { inviteId } = args

      const resendInviteEmail = resendInviteEmailFactory({
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        findUserByTarget: findUserByTargetFactory(),
        findInvite: findInviteFactory({ db })
      })

      await resendInviteEmail({ inviteId })

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
  },
  ProjectInviteMutations: {
    async create(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite()
      })

      await createProjectInvite(args, ctx.userId!, ctx.resourceAccessRules)
      return ctx.loaders.streams.getStream.load(args.projectId)
    },
    async batchCreate(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )

      const inviteCount = args.input.length
      if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          'Maximum 10 invites can be sent at once by non admins'
        )
      }

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite()
      })

      const inputBatches = chunk(args.input, 10)
      for (const batch of inputBatches) {
        await Promise.all(
          batch.map((i) =>
            createProjectInvite(
              { ...i, projectId: args.projectId },
              ctx.userId!,
              ctx.resourceAccessRules
            )
          )
        )
      }
      return ctx.loaders.streams.getStream.load(args.projectId)
    },
    async use(_parent, args, ctx) {
      const useProjectInvite = useProjectInviteAndNotifyFactory({
        finalizeInvite: finalizeResourceInviteFactory({
          findInvite: findInviteFactory({ db }),
          validateInvite: validateProjectInviteBeforeFinalizationFactory({
            getProject: getStream
          }),
          processInvite: processFinalizedProjectInviteFactory({
            getProject: getStream,
            addInviteDeclinedActivity: addStreamInviteDeclinedActivity,
            addProjectRole: addOrUpdateStreamCollaborator
          }),
          deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
          insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
          emitServerInvitesEvent: (...args) => getEventBus().emit(...args)
        })
      })

      await useProjectInvite(args.input, ctx.userId!, ctx.resourceAccessRules)
      return true
    },
    async cancel(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )

      const cancelInvite = cancelResourceInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db }),
        validateResourceAccess: validateProjectInviteBeforeFinalizationFactory({
          getProject: getStream
        })
      })

      await cancelInvite({
        resourceId: args.projectId,
        inviteId: args.inviteId,
        cancelerId: ctx.userId!,
        resourceType: ProjectInviteResourceType,
        cancelerResourceAccessLimits: ctx.resourceAccessRules
      })
      return ctx.loaders.streams.getStream.load(args.projectId)
    }
  }
} as Resolvers
