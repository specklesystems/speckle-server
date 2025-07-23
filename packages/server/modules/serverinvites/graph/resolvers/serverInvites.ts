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
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import {
  getInvitationTargetUsersFactory,
  getServerInviteForTokenFactory
} from '@/modules/serverinvites/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { chunk } from 'lodash-es'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import db from '@/db/knex'
import type { ServerRoles } from '@speckle/shared'
import {
  deleteInvitesByTargetFactory,
  findInviteFactory,
  findServerInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteInviteFactory as deleteInviteFromDbFactory,
  queryAllUserResourceInvitesFactory,
  queryAllResourceInvitesFactory,
  markInviteUpdatedFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import {
  createProjectInviteFactory,
  getPendingProjectCollaboratorsFactory,
  getUserPendingProjectInviteFactory,
  getUserPendingProjectInvitesFactory,
  useProjectInviteAndNotifyFactory
} from '@/modules/serverinvites/services/projectInviteManagement'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type {
  PrimaryInviteResourceTarget,
  ServerInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import {
  ServerInviteLimit,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { mapAuthToServerError } from '@/modules/shared/helpers/errorHelper'

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})
const getServerInfo = getServerInfoFactory({ db })
const getStream = getStreamFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const buildCollectAndValidateResourceTargets = () =>
  collectAndValidateCoreTargetsFactory({
    getStream
  })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaborator
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification
    }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
    getUser,
    getServerInfo
  })

const buildCreateAndSendServerOrProjectInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
    buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
      getStream
    }),
    emitEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      }),
    getUser,
    getServerInfo,
    finalizeInvite: buildFinalizeProjectInvite()
  })

export default {
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
      if (!token?.length) return null

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
      const inviterId = context.userId!
      const targetEmail = args.input.email

      const logger = context.log.child({
        targetEmail
      })

      const createAndSendInvite = buildCreateAndSendServerOrProjectInvite()

      const primaryResourceTarget: PrimaryInviteResourceTarget<ServerInviteResourceTarget> =
        {
          resourceId: '',
          role: (args.input.serverRole as ServerRoles) || Roles.Server.User,
          resourceType: ServerInviteResourceType,
          primary: true
        }
      await withOperationLogging(
        async () =>
          await createAndSendInvite(
            {
              target: targetEmail,
              inviterId,
              message: args.input.message,
              primaryResourceTarget
            },
            context.resourceAccessRules
          ),
        {
          logger,
          operationName: 'serverInviteCreate',
          operationDescription: 'Create and send a server invite'
        }
      )

      return true
    },

    async streamInviteCreate(_parent, args, context) {
      const targetId = args.input.userId
      const targetEmail = args.input.email
      const projectId = args.input.streamId
      const logger = context.log.child({
        targetId,
        targetEmail,
        projectId,
        streamId: projectId //legacy
      })
      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      await withOperationLogging(
        async () =>
          await createProjectInvite({
            input: args.input,
            inviterId: context.userId!,
            inviterResourceAccessRules: context.resourceAccessRules
          }),
        {
          logger,
          operationName: 'streamInviteCreate',
          operationDescription: 'Create and send a stream invite'
        }
      )

      return true
    },

    async serverInviteBatchCreate(_parent, args, context) {
      const { input: paramsArray } = args

      const inviteCount = paramsArray.length
      if (inviteCount > ServerInviteLimit && context.role !== Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          `Maximum ${ServerInviteLimit} invites can be sent at once by non admins`
        )
      }
      const logger = context.log.child({
        inviteCount
      })

      const createAndSendInvite = buildCreateAndSendServerOrProjectInvite()

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)

      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map(async (params) => {
            const primaryResourceTarget: PrimaryInviteResourceTarget<ServerInviteResourceTarget> =
              {
                resourceId: '',
                role: (params.serverRole as ServerRoles) || Roles.Server.User,
                resourceType: ServerInviteResourceType,
                primary: true
              }

            return await withOperationLogging(
              async () =>
                createAndSendInvite(
                  {
                    target: params.email,
                    inviterId: context.userId!,
                    message: params.message,
                    primaryResourceTarget
                  },
                  context.resourceAccessRules
                ),
              {
                logger: logger.child({
                  targetEmail: params.email
                }),
                operationName: 'serverInviteCreateFromBatch',
                operationDescription: 'Create and send a server invite from a batch'
              }
            )
          })
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

      const logger = context.log.child({
        inviteCount: paramsArray.length
      })

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)

      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map(async (params) => {
            return await withOperationLogging(
              async () =>
                createProjectInvite({
                  input: params,
                  inviterId: context.userId!,
                  inviterResourceAccessRules: context.resourceAccessRules
                }),
              {
                logger: logger.child({
                  projectId: params.streamId,
                  streamId: params.streamId, //legacy
                  targetId: params.userId,
                  targetEmail: params.email
                }),
                operationName: 'streamInviteCreateFromBatch',
                operationDescription: 'Create and send a stream invite from a batch'
              }
            )
          })
        )
      }

      return true
    },

    async streamInviteUse(_parent, args, ctx) {
      const projectId = args.streamId
      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })
      const useProjectInvite = useProjectInviteAndNotifyFactory({
        finalizeInvite: buildFinalizeProjectInvite()
      })

      await withOperationLogging(
        async () => await useProjectInvite(args, ctx.userId!, ctx.resourceAccessRules),
        {
          logger,
          operationName: 'streamInviteUse',
          operationDescription: 'Use a stream invite'
        }
      )
      return true
    },

    async streamInviteCancel(_parent, args, ctx) {
      const { streamId, inviteId } = args
      const { userId, resourceAccessRules } = ctx
      const logger = ctx.log.child({
        projectId: streamId,
        streamId, //legacy
        inviteId
      })

      const cancelInvite = cancelResourceInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db }),
        validateResourceAccess: validateProjectInviteBeforeFinalizationFactory({
          getProject: getStream
        }),
        emitEvent: getEventBus().emit
      })

      await authorizeResolver(userId, streamId, Roles.Stream.Owner, resourceAccessRules)
      await withOperationLogging(
        async () =>
          await cancelInvite({
            inviteId,
            cancelerId: userId!,
            cancelerResourceAccessLimits: resourceAccessRules
          }),
        {
          logger,
          operationName: 'streamInviteCancel',
          operationDescription: 'Cancel a stream invite'
        }
      )

      return true
    },

    async inviteResend(_parent, args, ctx) {
      const { inviteId } = args
      const logger = ctx.log.child({
        inviteId
      })

      const resendInviteEmail = resendInviteEmailFactory({
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        findUserByTarget: findUserByTargetFactory({ db }),
        findInvite: findInviteFactory({ db }),
        markInviteUpdated: markInviteUpdatedFactory({ db }),
        getUser,
        getServerInfo
      })

      await withOperationLogging(async () => await resendInviteEmail({ inviteId }), {
        logger,
        operationName: 'inviteResend',
        operationDescription: 'Resend an invite'
      })

      return true
    },

    async inviteDelete(_parent, args, ctx) {
      const { inviteId } = args
      const logger = ctx.log.child({
        inviteId
      })

      const deleteInvite = deleteInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db }),
        emitEvent: getEventBus().emit
      })

      await withOperationLogging(
        async () => await deleteInvite(inviteId, ctx.userId!),
        {
          logger,
          operationName: 'inviteDelete',
          operationDescription: 'Delete an invite'
        }
      )

      return true
    }
  },
  ProjectInviteMutations: {
    async create(_parent, args, ctx) {
      const { projectId } = args

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canInvite = await ctx.authPolicies.project.canInvite({
        userId: ctx.userId,
        projectId
      })
      if (!canInvite.isOk) {
        throw mapAuthToServerError(canInvite.error)
      }

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        targetEmail: args.input.email,
        targetId: args.input.userId
      })

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      await withOperationLogging(
        async () =>
          await createProjectInvite({
            input: {
              projectId,
              ...args.input
            },
            inviterId: ctx.userId!,
            inviterResourceAccessRules: ctx.resourceAccessRules
          }),
        {
          logger,
          operationName: 'projectInviteCreate',
          operationDescription: 'Create and send a project invite'
        }
      )
      return ctx.loaders.streams.getStream.load(projectId)
    },
    async batchCreate(_parent, args, ctx) {
      const { projectId } = args

      const inviteCount = args.input.length
      if (inviteCount > ServerInviteLimit && ctx.role !== Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          `Maximum ${ServerInviteLimit} invites can be sent at once by non admins`
        )
      }

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        inviteCount: args.input.length
      })

      const canInvite = await ctx.authPolicies.project.canInvite({
        userId: ctx.userId,
        projectId
      })
      if (!canInvite.isOk) {
        throw mapAuthToServerError(canInvite.error)
      }

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      const inputBatches = chunk(args.input, 10)
      for (const batch of inputBatches) {
        await Promise.all(
          batch.map((i) =>
            withOperationLogging(
              async () =>
                await createProjectInvite({
                  input: {
                    ...i,
                    projectId
                  },
                  inviterId: ctx.userId!,
                  inviterResourceAccessRules: ctx.resourceAccessRules
                }),
              {
                logger: logger.child({
                  targetId: i.userId,
                  targetEmail: i.email
                }),
                operationName: 'projectInviteCreateFromBatch',
                operationDescription: 'Create and send a project invite from a batch'
              }
            )
          )
        )
      }
      return ctx.loaders.streams.getStream.load(args.projectId)
    },
    async use(_parent, args, ctx) {
      const logger = ctx.log
      const useProjectInvite = useProjectInviteAndNotifyFactory({
        finalizeInvite: buildFinalizeProjectInvite()
      })

      await withOperationLogging(
        async () =>
          await useProjectInvite(args.input, ctx.userId!, ctx.resourceAccessRules),
        {
          logger,
          operationName: 'projectInviteUse',
          operationDescription: 'Use a project invite'
        }
      )
      return true
    },
    async cancel(_parent, args, ctx) {
      const { projectId, inviteId } = args

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canInvite = await ctx.authPolicies.project.canInvite({
        userId: ctx.userId,
        projectId
      })
      if (!canInvite.isOk) {
        throw mapAuthToServerError(canInvite.error)
      }

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        inviteId
      })

      const cancelInvite = cancelResourceInviteFactory({
        findInvite: findInviteFactory({ db }),
        deleteInvite: deleteInviteFromDbFactory({ db }),
        validateResourceAccess: validateProjectInviteBeforeFinalizationFactory({
          getProject: getStream
        }),
        emitEvent: getEventBus().emit
      })

      await withOperationLogging(
        async () =>
          await cancelInvite({
            inviteId,
            cancelerId: ctx.userId!,
            cancelerResourceAccessLimits: ctx.resourceAccessRules
          }),
        {
          logger,
          operationName: 'projectInviteCancel',
          operationDescription: 'Cancel a project invite'
        }
      )
      return ctx.loaders.streams.getStream.load(projectId)
    }
  }
} as Resolvers
