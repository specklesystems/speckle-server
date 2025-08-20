import { validateScopes } from '@/modules/shared'
import zxcvbn from 'zxcvbn'
import { Roles, Scopes } from '@speckle/shared'
import {
  legacyGetUserFactory,
  legacyGetUserByEmailFactory,
  getUserFactory,
  updateUserFactory,
  isLastAdminUserFactory,
  deleteUserRecordFactory,
  getUserRoleFactory,
  updateUserServerRoleFactory,
  searchUsersFactory,
  markOnboardingCompleteFactory,
  legacyGetPaginatedUsersCountFactory,
  legacyGetPaginatedUsersFactory,
  lookupUsersFactory,
  bulkLookupUsersFactory
} from '@/modules/core/repositories/users'
import { Users, UsersMeta } from '@/modules/core/dbSchema'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import {
  deleteAllUserInvitesFactory,
  countServerInvitesFactory,
  findServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import db from '@/db/knex'
import { BadRequestError } from '@/modules/shared/errors'
import {
  updateUserAndNotifyFactory,
  deleteUserFactory,
  changeUserRoleFactory
} from '@/modules/core/services/users/management'
import {
  deleteStreamFactory,
  getExplicitProjects,
  getUserDeletableStreamsFactory
} from '@/modules/core/repositories/streams'
import { dbLogger } from '@/observability/logging'
import { getAdminUsersListCollectionFactory } from '@/modules/core/services/users/legacyAdminUsersList'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getMailchimpStatus,
  getMailchimpOnboardingIds
} from '@/modules/shared/helpers/envHelper'
import { updateMailchimpMemberTags } from '@/modules/auth/services/mailchimp'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { asOperation } from '@/modules/shared/command'
import { setUserOnboardingChoicesFactory } from '@/modules/core/services/users/tracking'
import { getMixpanelClient } from '@/modules/shared/utils/mixpanel'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { getUserWorkspaceSeatsFactory } from '@/modules/workspacesCore/repositories/workspaces'
import { queryAllProjectsFactory } from '@/modules/core/services/projects'
import { getRegisteredRegionClients } from '@/modules/multiregion/utils/dbSelector'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'

const getUser = legacyGetUserFactory({ db })
const getUserByEmail = legacyGetUserByEmailFactory({ db })

const updateUserAndNotify = updateUserAndNotifyFactory({
  getUser: getUserFactory({ db }),
  updateUser: updateUserFactory({ db }),
  emitEvent: getEventBus().emit
})

const getServerInfo = getServerInfoFactory({ db })

const buildDeleteUser = async () => {
  const regionClients = await getRegisteredRegionClients()
  const regionDbs = Object.values(regionClients)

  return deleteUserFactory({
    deleteStream: deleteStreamFactory({ db }),
    logger: dbLogger,
    isLastAdminUser: isLastAdminUserFactory({ db }),
    getUserDeletableStreams: getUserDeletableStreamsFactory({ db }),
    queryAllProjects: queryAllProjectsFactory({
      getExplicitProjects: getExplicitProjects({ db })
    }),
    getUserWorkspaceSeats: getUserWorkspaceSeatsFactory({ db }),
    deleteAllUserInvites: deleteAllUserInvitesFactory({ db }),
    deleteUserRecord: replicateQuery([db, ...regionDbs], deleteUserRecordFactory),
    emitEvent: getEventBus().emit
  })
}

const getUserRole = getUserRoleFactory({ db })
const changeUserRole = changeUserRoleFactory({
  getServerInfo,
  isLastAdminUser: isLastAdminUserFactory({ db }),
  updateUserServerRole: updateUserServerRoleFactory({ db })
})
const searchUsers = searchUsersFactory({ db })
const bulkLookupUsers = bulkLookupUsersFactory({ db })
const lookupUsers = lookupUsersFactory({ db })
const markOnboardingComplete = markOnboardingCompleteFactory({ db })
const getAdminUsersListCollection = getAdminUsersListCollectionFactory({
  countUsers: legacyGetPaginatedUsersCountFactory({ db }),
  countServerInvites: countServerInvitesFactory({ db }),
  findServerInvites: findServerInvitesFactory({ db }),
  getUsers: legacyGetPaginatedUsersFactory({ db })
})

export default {
  Query: {
    async activeUser(_parent, _args, context) {
      const activeUserId = context.userId
      if (!activeUserId) return null

      // Only if authenticated - check for server roles & scopes
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Read)

      return await getUser(activeUserId)
    },
    async otherUser(_parent, args) {
      const { id } = args
      if (!id) return null
      return await getUser(id)
    },
    async user(_parent, args, context) {
      // User wants info about himself and he's not authenticated - just return null
      if (!context.auth && !args.id) return null

      await throwForNotHavingServerRole(context, Roles.Server.Guest)

      if (!args.id) await validateScopes(context.scopes, Scopes.Profile.Read)
      else await validateScopes(context.scopes, Scopes.Users.Read)

      if (!args.id && !context.userId) {
        throw new BadRequestError('You must provide an user id.')
      }

      return await getUser((args.id || context.userId)!)
    },

    async adminUsers(_parent, args) {
      return await getAdminUsersListCollection(args)
    },

    async userSearch(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Read)
      await validateScopes(context.scopes, Scopes.Users.Read)

      if (args.query.length < 3)
        throw new BadRequestError('Search query must be at least 3 characters.')

      if (args.limit && args.limit > 100)
        throw new BadRequestError(
          'Cannot return more than 100 items, please use pagination.'
        )

      const { cursor, users } = await searchUsers(
        args.query,
        args.limit,
        args.cursor || undefined,
        args.archived,
        args.emailOnly
      )
      return { cursor, items: users }
    },

    async users(_parent, args, context) {
      if (args.input.query.length < 1)
        throw new BadRequestError('Search query must be at least 1 character.')

      if ((args.input.limit || 0) > 100)
        throw new BadRequestError(
          'Cannot return more than 100 items, please use pagination.'
        )

      if (args.input.projectId) {
        const canRead = await context.authPolicies.project.canRead({
          projectId: args.input.projectId,
          userId: context.userId
        })
        throwIfAuthNotOk(canRead)
      }

      const { cursor, users } = await lookupUsers(args.input)
      return { cursor, items: users }
    },
    async usersByEmail(_parent, args) {
      if (args.input.emails.length < 1)
        throw new BadRequestError('Must provide at least one email to search for.')

      if ((args.input.limit || 0) > 20)
        throw new BadRequestError(
          'Cannot return more than 20 items, please use a shorter list.'
        )

      return await bulkLookupUsers(args.input)
    },
    async userPwdStrength(_parent, args) {
      const res = zxcvbn(args.pwd)
      return { score: res.score, feedback: res.feedback }
    }
  },

  User: {
    async email(parent, _args, context) {
      // NOTE: we're redacting the field (returning null) rather than throwing a full error which would invalidate the request.
      if (context.userId === parent.id) {
        try {
          await validateScopes(context.scopes, Scopes.Profile.Email)
          return parent.email
        } catch {
          return null
        }
      }

      try {
        // you should only have access to other users email if you have elevated privileges
        await throwForNotHavingServerRole(context, Roles.Server.Admin)
        await validateScopes(context.scopes, Scopes.Users.Email)
        return parent.email
      } catch {
        return null
      }
    },
    async role(parent) {
      return await getUserRole(parent.id)
    },
    async isOnboardingFinished(parent, _args, ctx) {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.id,
        key: UsersMeta.metaKey.isOnboardingFinished
      })
      return !!metaVal?.value
    },
    meta: async (parent) => ({
      userId: parent.id
    })
  },
  UserMeta: {
    newWorkspaceExplainerDismissed: async (parent, _args, ctx) => {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.userId,
        key: UsersMeta.metaKey.newWorkspaceExplainerDismissed
      })
      return !!metaVal?.value
    },
    speckleConBannerDismissed: async (parent, _args, ctx) => {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.userId,
        key: UsersMeta.metaKey.speckleConBannerDismissed
      })
      return !!metaVal?.value
    },
    legacyProjectsExplainerCollapsed: async (parent, _args, ctx) => {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.userId,
        key: UsersMeta.metaKey.legacyProjectsExplainerCollapsed
      })
      return !!metaVal?.value
    }
  },
  LimitedUser: {
    async role(parent) {
      return await getUserRole(parent.id)
    }
  },
  Mutation: {
    async userUpdate(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      const logger = context.log.child({
        userIdToOperateOn: context.userId
      })
      await withOperationLogging(
        async () => await updateUserAndNotify(context.userId!, args.user),
        {
          logger,
          operationName: 'updateUser',
          operationDescription: `Update user`
        }
      )
      return true
    },

    async userRoleChange(_parent, args, ctx) {
      const logger = ctx.log.child({
        userIdToOperateOn: args.userRoleInput.id
      })
      await withOperationLogging(
        async () =>
          await changeUserRole({
            role: args.userRoleInput.role,
            userId: args.userRoleInput.id
          }),
        {
          logger,
          operationName: 'changeUserRole',
          operationDescription: `Change user role`
        }
      )
      return true
    },

    async adminDeleteUser(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      const user = await getUserByEmail({ email: args.userConfirmation.email })
      if (!user) return false

      const logger = context.log.child({
        userIdToOperateOn: user.id
      })
      const deleteUser = await buildDeleteUser()

      await withOperationLogging(
        async () => await deleteUser(user.id, context.userId),
        {
          logger,
          operationName: 'adminDeleteUser',
          operationDescription: `Admin deletion of an user`
        }
      )
      return true
    },

    async userDelete(_parent, args, context) {
      const user = await getUser(context.userId!)
      const logger = context.log.child({
        userIdToOperateOn: context.userId
      })

      if (args.userConfirmation.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new BadRequestError('Malformed input: emails do not match.')
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself.
      // Since I am paranoid, I'll leave them here too.
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Delete)
      const deleteUser = await buildDeleteUser()

      await withOperationLogging(
        async () => await deleteUser(context.userId!, context.userId!),
        {
          logger,
          operationName: 'deleteUser',
          operationDescription: `Delete user`
        }
      )

      return true
    },

    activeUserMutations: () => ({})
  },
  ActiveUserMutations: {
    async finishOnboarding(_parent, args, ctx) {
      const userId = ctx.userId
      if (!userId) return false
      const logger = ctx.log.child({
        userIdToOperateOn: userId
      })

      const success = await withOperationLogging(
        async () => await markOnboardingComplete(userId),
        {
          logger,
          operationName: 'finishOnboarding',
          operationDescription: `Finish onboarding`
        }
      )

      // If onboarding was marked complete successfully and we have onboarding data
      if (success && args.input) {
        const choices = args.input
        try {
          await asOperation(
            async () => {
              const setUserOnboardingChoices = setUserOnboardingChoicesFactory({
                getUser: getUserFactory({ db }),
                updateMailchimpMemberTags,
                getMixpanelClient,
                getMailchimpStatus,
                getMailchimpOnboardingIds
              })

              return await setUserOnboardingChoices({
                userId,
                choices: {
                  role: choices.role || undefined,
                  plans: choices.plans || undefined,
                  source: choices.source || undefined
                }
              })
            },
            {
              logger: ctx.log,
              name: 'Set user onboarding choices'
            }
          )
        } catch {
          // Suppress, already logged by asOperation
        }
      }

      return success
    },
    async update(_parent, args, context) {
      const logger = context.log
      const newUser = await withOperationLogging(
        async () => await updateUserAndNotify(context.userId!, args.user),
        {
          logger,
          operationName: 'updateUser',
          operationDescription: 'Update user'
        }
      )
      return newUser
    },
    meta: () => ({})
  },
  UserMetaMutations: {
    setLegacyProjectsExplainerCollapsed: async (_parent, args, ctx) => {
      const meta = metaHelpers(Users, db)
      const res = await meta.set(
        ctx.userId!,
        UsersMeta.metaKey.legacyProjectsExplainerCollapsed,
        args.value
      )

      return !!res.value
    },
    setNewWorkspaceExplainerDismissed: async (_parent, args, ctx) => {
      const meta = metaHelpers(Users, db)
      const res = await meta.set(
        ctx.userId!,
        UsersMeta.metaKey.newWorkspaceExplainerDismissed,
        args.value
      )

      return !!res.value
    },
    setSpeckleConBannerDismissed: async (_parent, args, ctx) => {
      const meta = metaHelpers(Users, db)
      const res = await meta.set(
        ctx.userId!,
        UsersMeta.metaKey.speckleConBannerDismissed,
        args.value
      )

      return !!res.value
    }
  }
} as Resolvers
