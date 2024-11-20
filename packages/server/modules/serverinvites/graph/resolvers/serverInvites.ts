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
import {
  PrimaryInviteResourceTarget,
  ServerInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamInviteDeclinedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
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
import { publish } from '@/modules/shared/utils/subscriptions'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  getStreamFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
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
    getServerInfo
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
      const createAndSendInvite = buildCreateAndSendServerOrProjectInvite()

      const primaryResourceTarget: PrimaryInviteResourceTarget<ServerInviteResourceTarget> =
        {
          resourceId: '',
          role: (args.input.serverRole as ServerRoles) || Roles.Server.User,
          resourceType: ServerInviteResourceType,
          primary: true
        }
      await createAndSendInvite(
        {
          target: args.input.email,
          inviterId: context.userId!,
          message: args.input.message,
          primaryResourceTarget
        },
        context.resourceAccessRules
      )

      return true
    },

    async streamInviteCreate(_parent, args, context) {
      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      await createProjectInvite({
        input: args.input,
        inviterId: context.userId!,
        inviterResourceAccessRules: context.resourceAccessRules
      })

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
          paramsBatchArray.map((params) => {
            const primaryResourceTarget: PrimaryInviteResourceTarget<ServerInviteResourceTarget> =
              {
                resourceId: '',
                role: (params.serverRole as ServerRoles) || Roles.Server.User,
                resourceType: ServerInviteResourceType,
                primary: true
              }

            return createAndSendInvite(
              {
                target: params.email,
                inviterId: context.userId!,
                message: params.message,
                primaryResourceTarget
              },
              context.resourceAccessRules
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

      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      // Batch calls so that we don't kill the server
      const batches = chunk(paramsArray, 50)
      for (const paramsBatchArray of batches) {
        await Promise.all(
          paramsBatchArray.map((params) => {
            return createProjectInvite({
              input: params,
              inviterId: context.userId!,
              inviterResourceAccessRules: context.resourceAccessRules
            })
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
            addInviteDeclinedActivity: addStreamInviteDeclinedActivityFactory({
              saveActivity: saveActivityFactory({ db }),
              publish
            }),
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
        findUserByTarget: findUserByTargetFactory({ db }),
        findInvite: findInviteFactory({ db }),
        markInviteUpdated: markInviteUpdatedFactory({ db }),
        getUser,
        getServerInfo
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
      const createProjectInvite = createProjectInviteFactory({
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      await createProjectInvite({
        input: {
          projectId: args.projectId,
          ...args.input
        },
        inviterId: ctx.userId!,
        inviterResourceAccessRules: ctx.resourceAccessRules
      })
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
        createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
        getStream
      })

      const inputBatches = chunk(args.input, 10)
      for (const batch of inputBatches) {
        await Promise.all(
          batch.map((i) =>
            createProjectInvite({
              input: {
                ...i,
                projectId: args.projectId
              },
              inviterId: ctx.userId!,
              inviterResourceAccessRules: ctx.resourceAccessRules
            })
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
            addInviteDeclinedActivity: addStreamInviteDeclinedActivityFactory({
              saveActivity: saveActivityFactory({ db }),
              publish
            }),
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
