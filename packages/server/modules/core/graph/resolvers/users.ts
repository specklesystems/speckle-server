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
import { UsersMeta } from '@/modules/core/dbSchema'
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
  getUserDeletableStreamsFactory
} from '@/modules/core/repositories/streams'
import { dbLogger } from '@/logging/logging'
import { getAdminUsersListCollectionFactory } from '@/modules/core/services/users/legacyAdminUsersList'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getMailchimpStatus,
  getMailchimpOnboardingIds
} from '@/modules/shared/helpers/envHelper'
import { updateMailchimpMemberTags } from '@/modules/auth/services/mailchimp'
import { OnboardingRole, OnboardingPlan, OnboardingSource } from '@speckle/shared'

const getUser = legacyGetUserFactory({ db })
const getUserByEmail = legacyGetUserByEmailFactory({ db })

const updateUserAndNotify = updateUserAndNotifyFactory({
  getUser: getUserFactory({ db }),
  updateUser: updateUserFactory({ db }),
  emitEvent: getEventBus().emit
})

const getServerInfo = getServerInfoFactory({ db })
const deleteUser = deleteUserFactory({
  deleteStream: deleteStreamFactory({ db }),
  logger: dbLogger,
  isLastAdminUser: isLastAdminUserFactory({ db }),
  getUserDeletableStreams: getUserDeletableStreamsFactory({ db }),
  deleteAllUserInvites: deleteAllUserInvitesFactory({ db }),
  deleteUserRecord: deleteUserRecordFactory({ db }),
  emitEvent: getEventBus().emit
})
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

export = {
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
        throw new BadRequestError('Search query must be at least 3 carachters.')

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

    async users(_parent, args) {
      if (args.input.query.length < 1)
        throw new BadRequestError('Search query must be at least 1 character.')

      if ((args.input.limit || 0) > 100)
        throw new BadRequestError(
          'Cannot return more than 100 items, please use pagination.'
        )

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
      await updateUserAndNotify(context.userId!, args.user)
      return true
    },

    async userRoleChange(_parent, args) {
      await changeUserRole({
        role: args.userRoleInput.role,
        userId: args.userRoleInput.id
      })
      return true
    },

    async adminDeleteUser(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      const user = await getUserByEmail({ email: args.userConfirmation.email })
      if (!user) return false

      await deleteUser(user.id, context.userId)
      return true
    },

    async userDelete(_parent, args, context) {
      const user = await getUser(context.userId!)

      if (args.userConfirmation.email !== user.email) {
        throw new BadRequestError('Malformed input: emails do not match.')
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself.
      // Since I am paranoid, I'll leave them here too.
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Delete)

      await deleteUser(context.userId!, context.userId!)

      return true
    },

    activeUserMutations: () => ({})
  },
  ActiveUserMutations: {
    async finishOnboarding(_parent, args, ctx) {
      const userId = ctx.userId
      if (!userId) return false

      const success = await markOnboardingComplete(userId)

      // If onboarding was marked complete successfully and we have onboarding data
      if (success && args.input && getMailchimpStatus()) {
        try {
          const user = await getUser(userId)
          const { listId } = getMailchimpOnboardingIds()

          await updateMailchimpMemberTags(user, listId, {
            role: args.input?.role as OnboardingRole | undefined,
            plans: args.input?.plans as OnboardingPlan[] | undefined,
            source: args.input?.source as OnboardingSource | undefined
          })
        } catch (error) {
          // Log but don't fail the request
          ctx.log.warn({ err: error }, 'Failed to update Mailchimp tags')
        }
      }

      return success
    },
    async update(_parent, args, context) {
      const newUser = await updateUserAndNotify(context.userId!, args.user)
      return newUser
    }
  }
} as Resolvers
