import {
  filteredSubscribe,
  StreamSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
import {
  getPendingProjectCollaboratorsFactory,
  inviteUsersToProjectFactory
} from '@/modules/serverinvites/services/projectInviteManagement'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { get } from 'lodash-es'
import {
  getStreamFactory,
  createStreamFactory,
  updateStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  getDiscoverableStreamsPageFactory,
  countDiscoverableStreamsFactory,
  legacyGetStreamsFactory,
  getFavoritedStreamsCountFactory,
  getFavoritedStreamsPageFactory,
  canUserFavoriteStreamFactory,
  setStreamFavoritedFactory,
  getUserStreamsPageFactory,
  getUserStreamsCountFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
import {
  createStreamReturnRecordFactory,
  deleteStreamAndNotifyFactory,
  updateStreamAndNotifyFactory,
  updateStreamRoleAndNotifyFactory
} from '@/modules/core/services/streams/management'
import type { Nullable } from '@speckle/shared'
import { Roles, Scopes } from '@speckle/shared'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'

import {
  toProjectIdWhitelist,
  isResourceAllowed,
  throwIfResourceAccessNotAllowed,
  throwIfNewResourceNotAllowed
} from '@/modules/core/helpers/token'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import {
  deleteAllResourceInvitesFactory,
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  queryAllResourceInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import db from '@/db/knex'
import { getInvitationTargetUsersFactory } from '@/modules/serverinvites/services/retrieval'
import { BadRequestError, InvalidArgumentError } from '@/modules/shared/errors'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { getDiscoverableStreamsFactory } from '@/modules/core/services/streams/discoverableStreams'
import {
  favoriteStreamFactory,
  getFavoriteStreamsCollectionFactory
} from '@/modules/core/services/streams/favorite'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  adminOverrideEnabled,
  isRateLimiterEnabled
} from '@/modules/shared/helpers/envHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
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
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import {
  deleteProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { deleteProjectAndCommitsFactory } from '@/modules/core/services/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { getProjectReplicationDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { Logger } from '@/observability/logging'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getFavoriteStreamsCollection = getFavoriteStreamsCollectionFactory({
  getFavoritedStreamsCount: getFavoritedStreamsCountFactory({ db }),
  getFavoritedStreamsPage: getFavoritedStreamsPageFactory({ db })
})
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
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
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

const deleteStreamAndNotify = async (
  projectId: string,
  userId: string,
  ctxLogger: Logger
) =>
  asMultiregionalOperation(
    ({ allDbs, mainDb, emit }) => {
      const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
        deleteProjectAndCommits: deleteProjectAndCommitsFactory({
          deleteProject: replicateFactory(allDbs, deleteProjectFactory),
          deleteProjectCommits: replicateFactory(allDbs, deleteProjectCommitsFactory)
        }),
        emitEvent: emit,
        deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db: mainDb }),
        getStream: getStreamFactory({ db: mainDb })
      })
      return deleteStreamAndNotify(projectId, userId)
    },
    {
      logger: ctxLogger,
      name: 'delete project',
      description: `Cascade deleting a project`,
      dbs: await getProjectReplicationDbClients({ projectId })
    }
  )

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})
const updateStreamRoleAndNotify = updateStreamRoleAndNotifyFactory({
  isStreamCollaborator,
  addOrUpdateStreamCollaborator: addOrUpdateStreamCollaboratorFactory({
    validateStreamAccess,
    getUser,
    grantStreamPermissions: grantStreamPermissionsFactory({ db }),
    getStreamRoles: getStreamRolesFactory({ db }),
    emitEvent: getEventBus().emit
  }),
  removeStreamCollaborator
})
const getDiscoverableStreams = getDiscoverableStreamsFactory({
  getDiscoverableStreamsPage: getDiscoverableStreamsPageFactory({ db }),
  countDiscoverableStreams: countDiscoverableStreamsFactory({ db })
})
const getStreams = legacyGetStreamsFactory({ db })
const favoriteStream = favoriteStreamFactory({
  canUserFavoriteStream: canUserFavoriteStreamFactory({ db }),
  setStreamFavorited: setStreamFavoritedFactory({ db }),
  getStream
})
const getUserStreams = getUserStreamsPageFactory({ db })
const getUserStreamsCount = getUserStreamsCountFactory({ db })
const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

/**
 * @type {import('@/modules/core/graph/generated/graphql').Resolvers}
 */
export default {
  Query: {
    async stream(_, args, context) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const stream = await getStream({ streamId: args.id, userId: context.userId })
      if (!stream) {
        throw new StreamNotFoundError('Stream not found')
      }

      await authorizeResolver(
        context.userId,
        args.id,
        Roles.Stream.Reviewer,
        context.resourceAccessRules
      )

      if (stream.visibility !== ProjectRecordVisibility.Public) {
        await throwForNotHavingServerRole(context, Roles.Server.Guest)
        await validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return stream
    },

    async streams(_, args, ctx) {
      const countOnly = args.limit === 0 && !args.query

      const [totalCount, visibleCount, { cursor, streams }] = await Promise.all([
        getUserStreamsCount({
          userId: ctx.userId!,
          forOtherUser: false,
          searchQuery: args.query || undefined,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
        }),
        getUserStreamsCount({
          userId: ctx.userId!,
          forOtherUser: false,
          searchQuery: args.query || undefined,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true
        }),
        !countOnly
          ? getUserStreams({
              userId: ctx.userId!,
              limit: args.limit,
              cursor: args.cursor || undefined,
              searchQuery: args.query || undefined,
              forOtherUser: false,
              streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
              onlyWithActiveSsoSession: true
            })
          : { cursor: null, streams: [] }
      ])

      return {
        totalCount,
        numberOfHidden: totalCount - visibleCount,
        cursor,
        items: streams
      }
    },

    async discoverableStreams(_, args, ctx) {
      return await getDiscoverableStreams(
        args,
        toProjectIdWhitelist(ctx.resourceAccessRules)
      )
    },

    async adminStreams(_, args, ctx) {
      if (args.limit && args.limit > 50)
        throw new BadRequestError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        offset: args.offset,
        limit: args.limit,
        orderBy: args.orderBy,
        publicOnly: null,
        searchQuery: args.query,
        visibility: args.visibility as Nullable<ProjectRecordVisibility>,
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
        cursor: null
      })
      return { totalCount, items: streams }
    }
  },

  Stream: {
    isPublic(parent) {
      return parent.visibility === ProjectRecordVisibility.Public
    },
    isDiscoverable: () => false,
    async collaborators(parent, _args, ctx) {
      const collaborators = await ctx.loaders.streams.getCollaborators.load(parent.id)

      // In this GQL return type, role actually refers to the stream role
      return collaborators.map((collaborator) => ({
        ...collaborator,
        role: collaborator.streamRole
      }))
    },

    async pendingCollaborators(parent) {
      const { id: streamId } = parent
      return await getPendingProjectCollaboratorsFactory({
        queryAllResourceInvites: queryAllResourceInvitesFactory({ db }),
        getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
      })(streamId)
    },

    async favoritedDate(parent, _args, ctx) {
      const { id: streamId } = parent

      if (!ctx.userId) {
        return null
      }

      if (!streamId) {
        throw new InvalidArgumentError('Invalid stream ID')
      }

      return (
        (await ctx.loaders.streams.getUserFavoriteData.load(streamId))?.createdAt ||
        null
      )
    },

    async favoritesCount(parent, _args, ctx) {
      const { id: streamId } = parent

      if (!streamId) {
        throw new InvalidArgumentError('Invalid stream ID')
      }

      return (await ctx.loaders.streams.getFavoritesCount.load(streamId)) || 0
    },

    async role(parent, _args, ctx) {
      // If role already resolved, return that
      const role = get(parent, 'role') as string | undefined
      if (role?.length) return role

      // Otherwise resolve it now through a dataloader
      return await ctx.loaders.streams.getRole.load(parent.id)
    }
  },
  User: {
    async streams(parent, args, ctx) {
      // Return only the user's public streams if parent.id !== context.userId
      const forOtherUser = parent.id !== ctx.userId

      const [totalCount, visibleCount, { cursor, streams }] = await Promise.all([
        getUserStreamsCount({
          userId: parent.id,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
        }),
        getUserStreamsCount({
          userId: parent.id,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true
        }),
        getUserStreams({
          userId: parent.id,
          limit: args.limit,
          cursor: args.cursor || undefined,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true
        })
      ])

      return {
        totalCount,
        numberOfHidden: totalCount - visibleCount,
        cursor,
        items: streams
      }
    },

    async favoriteStreams(parent, args, context) {
      const { userId } = context
      const { id: requestedUserId } = parent || {}
      const { limit, cursor } = args

      if (userId !== requestedUserId)
        throw new BadRequestError("Cannot view another user's favorite streams")

      return await getFavoriteStreamsCollection({
        userId,
        limit,
        cursor,
        streamIdWhitelist: toProjectIdWhitelist(context.resourceAccessRules)
      })
    },

    async totalOwnedStreamsFavorites(parent, _args, ctx) {
      const { id: userId } = parent
      if (!userId) {
        throw new InvalidArgumentError('Invalid user ID')
      }

      return (await ctx.loaders.streams.getOwnedFavoritesCount.load(userId)) || 0
    }
  },
  LimitedUser: {
    async streams(parent, args, ctx) {
      // a little escape hatch for admins to look into users streams
      const isAdminOverride = adminOverrideEnabled() && ctx.role === Roles.Server.Admin

      // if isAdminOverride, then the ctx.user has to be treaded as the parent user
      // to give the admin full view into the parent user's project streams
      const forOtherUser = parent.id === ctx.userId ? false : !isAdminOverride
      const userId = parent.id
      const [totalCount, visibleCount, { cursor, streams }] = await Promise.all([
        getUserStreamsCount({
          userId,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
        }),
        getUserStreamsCount({
          userId,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true
        }),
        getUserStreams({
          userId,
          limit: args.limit,
          cursor: args.cursor || undefined,
          forOtherUser,
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true
        })
      ])

      return {
        totalCount,
        numberOfHidden: totalCount - visibleCount,
        cursor,
        items: streams
      }
    },
    async totalOwnedStreamsFavorites(parent, _args, ctx) {
      const { id: userId } = parent
      if (!userId) {
        throw new InvalidArgumentError('Invalid user ID')
      }

      return (await ctx.loaders.streams.getOwnedFavoritesCount.load(userId)) || 0
    }
  },
  Mutation: {
    async streamCreate(_, args, context) {
      await throwIfRateLimited({
        action: 'STREAM_CREATE',
        source: context.userId!
      })

      throwIfNewResourceNotAllowed({
        resourceAccessRules: context.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })
      const canCreate = await context.authPolicies.project.canCreatePersonal({
        userId: context.userId!
      })
      throwIfAuthNotOk(canCreate)

      const { id } = await asMultiregionalOperation(
        async ({ allDbs, mainDb, emit }) =>
          createStreamReturnRecordFactory({
            inviteUsersToProject: inviteUsersToProjectFactory({
              createAndSendInvite: createAndSendInviteFactory({
                findUserByTarget: findUserByTargetFactory({ db: mainDb }),
                insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({
                  db: mainDb
                }),
                collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory(
                  {
                    getStream: getStreamFactory({ db: mainDb })
                  }
                ),
                buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
                  getStream: getStreamFactory({ db: mainDb })
                }),
                emitEvent: emit,
                getUser: getUserFactory({ db: mainDb }),
                getServerInfo: getServerInfoFactory({ db: mainDb }),
                finalizeInvite: buildFinalizeProjectInvite()
              }),
              getUsers: getUsersFactory({ db: mainDb })
            }),
            createStream: replicateFactory(allDbs, createStreamFactory),
            storeProjectRole: storeProjectRoleFactory({ db: mainDb }),
            emitEvent: emit
          })({
            ...args.stream,
            ownerId: context.userId!,
            ownerResourceAccessRules: context.resourceAccessRules
          }),
        {
          logger: context.log,
          name: 'createStream',
          description: `Create a new Stream`,
          dbs: [db] // legacy; no multiregion ctx
        }
      )

      return id
    },

    async streamUpdate(_, args, context) {
      const projectId = args.stream.id

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canUpdate = await context.authPolicies.project.canUpdate({
        userId: context.userId!,
        projectId
      })
      throwIfAuthNotOk(canUpdate)

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      await asMultiregionalOperation(
        async ({ mainDb, allDbs, emit }) => {
          const updateStreamAndNotify = updateStreamAndNotifyFactory({
            getStream: getStreamFactory({ db: mainDb }),
            updateStream: replicateFactory(allDbs, updateStreamFactory),
            emitEvent: emit
          })

          await updateStreamAndNotify(args.stream, context.userId!)
        },
        {
          logger,
          name: 'updateStream',
          dbs: await getProjectReplicationDbClients({ projectId })
        }
      )
      return true
    },

    async streamDelete(_, args, context) {
      const projectId = args.id

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canDelete = await context.authPolicies.project.canDelete({
        userId: context.userId!,
        projectId
      })
      throwIfAuthNotOk(canDelete)

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      return await deleteStreamAndNotify(args.id, context.userId!, logger)
    },

    async streamsDelete(_, args, context) {
      const logger = context.log

      const results = await Promise.all(
        (args.ids || []).map(async (id) => {
          throwIfResourceAccessNotAllowed({
            resourceId: id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canDelete = await context.authPolicies.project.canDelete({
            userId: context.userId!,
            projectId: id
          })
          throwIfAuthNotOk(canDelete)

          return await deleteStreamAndNotify(id, context.userId!, logger)
        })
      )

      return results.every((res) => res === true)
    },

    async streamUpdatePermission(_, args, context) {
      const projectId = args.permissionParams.streamId

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canUpdate = await context.authPolicies.project.canUpdate({
        userId: context.userId!,
        projectId
      })
      throwIfAuthNotOk(canUpdate)

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })
      const result = await withOperationLogging(
        async () =>
          await updateStreamRoleAndNotify(
            args.permissionParams,
            context.userId!,
            context.resourceAccessRules
          ),
        {
          logger,
          operationName: 'updateStreamPermission',
          operationDescription: `Update a Stream Permission`
        }
      )
      return !!result
    },

    async streamRevokePermission(_, args, context) {
      const projectId = args.permissionParams.streamId

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canUpdate = await context.authPolicies.project.canUpdate({
        userId: context.userId!,
        projectId
      })
      throwIfAuthNotOk(canUpdate)

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })
      const result = await withOperationLogging(
        async () =>
          await updateStreamRoleAndNotify(
            args.permissionParams,
            context.userId!,
            context.resourceAccessRules
          ),
        {
          logger,
          operationName: 'revokeStreamPermission',
          operationDescription: `Revoke a Stream Permission`
        }
      )
      return !!result
    },

    async streamFavorite(_parent, args, ctx) {
      const { streamId, favorited } = args
      const { userId, resourceAccessRules } = ctx
      const logger = ctx.log.child({
        projectId: streamId,
        streamId //legacy
      })

      const stream = await withOperationLogging(
        async () =>
          await favoriteStream({
            userId: userId!,
            streamId,
            favorited,
            userResourceAccessRules: resourceAccessRules
          }),
        {
          logger,
          operationName: 'favoriteStream',
          operationDescription: `Favorite a Stream`
        }
      )

      return stream
    },

    async streamLeave(_parent, args, ctx) {
      const { streamId } = args
      const { userId } = ctx

      throwIfResourceAccessNotAllowed({
        resourceId: streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })
      const canLeave = await ctx.authPolicies.project.canLeave({
        userId: ctx.userId!,
        projectId: streamId
      })
      throwIfAuthNotOk(canLeave)

      const logger = ctx.log.child({
        projectId: streamId,
        streamId //legacy
      })

      await withOperationLogging(
        async () =>
          await removeStreamCollaborator(
            streamId,
            userId!,
            userId!,
            ctx.resourceAccessRules
          ),
        {
          logger,
          operationName: 'leaveStream',
          operationDescription: `Leave a Stream`
        }
      )

      return true
    }
  },

  Subscription: {
    userStreamAdded: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.UserStreamAdded,
        (payload, _variables, context) => {
          const hasResourceAccess = isResourceAllowed({
            resourceId: payload.userStreamAdded.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })

          if (!hasResourceAccess) {
            return false
          }

          return payload.ownerId === context.userId
        }
      )
    },
    userStreamRemoved: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.UserStreamRemoved,
        (payload, _variables, context) => {
          const hasResourceAccess = isResourceAllowed({
            resourceId: payload.userStreamRemoved.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          if (!hasResourceAccess) {
            return false
          }

          return payload.ownerId === context.userId
        }
      )
    },

    streamUpdated: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.StreamUpdated,
        async (payload, variables, context) => {
          throwIfResourceAccessNotAllowed({
            resourceId: payload.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canRead = await context.authPolicies.project.canRead({
            userId: context.userId!,
            projectId: payload.id
          })
          throwIfAuthNotOk(canRead)

          await authorizeResolver(
            context.userId,
            payload.id,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )
          return payload.id === variables.streamId
        }
      )
    },

    streamDeleted: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.StreamDeleted,
        async (payload, variables, context) => {
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canRead = await context.authPolicies.project.canRead({
            userId: context.userId!,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canRead)

          return payload.streamId === variables.streamId
        }
      )
    }
  },
  StreamCollaborator: {
    async serverRole(parent, _args, ctx) {
      const { id } = parent
      const user = await ctx.loaders.users.getUser.load(id)
      return user?.role
    }
  },
  PendingStreamCollaborator: {
    async invitedBy(parent, _args, ctx) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    },
    async streamName(parent, _args, ctx) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)
      return stream!.name
    },
    async token(parent, _args, ctx) {
      const authedUserId = ctx.userId
      const targetUserId = parent.user?.id
      const inviteId = parent.inviteId

      // Only returning it for the user that is the pending stream collaborator
      if (!authedUserId || !targetUserId || authedUserId !== targetUserId) {
        return null
      }

      const invite = await ctx.loaders.invites.getInvite.load(inviteId)
      return invite?.token || null
    }
  }
} as Resolvers
