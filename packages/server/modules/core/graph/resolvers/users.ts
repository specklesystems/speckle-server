'use strict'
import { UserInputError } from 'apollo-server-express'
import {
  getUser,
  getUserByEmail,
  getUserRole,
  deleteUser,
  searchUsers,
  changeUserRole
} from '@/modules/core/services/users'
import { updateUserAndNotify } from '@/modules/core/services/users/management'
import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes } from '@/modules/activitystream/helpers/types'
import { validateScopes } from '@/modules/shared'
import zxcvbn from 'zxcvbn'
import { getAdminUsersListCollection } from '@/modules/core/services/users/adminUsersListService'
import { Roles, Scopes } from '@speckle/shared'
import { markOnboardingComplete } from '@/modules/core/repositories/users'
import { UsersMeta } from '@/modules/core/dbSchema'
import { getServerInfo } from '@/modules/core/services/generic'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { AuthContext } from '@/modules/shared/authz'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserUpdateError } from '@/modules/core/errors/user'

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
export = {
  Query: {
    async _() {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    },
    async activeUser(_parent: never, _args: never, context: AuthContext) {
      const activeUserId = context.userId
      if (!activeUserId) return null

      // Only if authenticated - check for server roles & scopes
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Read)

      return await getUser(activeUserId)
    },
    async otherUser(_parent: never, args: { id?: string }) {
      const { id } = args
      if (!id) return null
      return await getUser(id)
    },
    async user(parent: never, args: { id?: string }, context: AuthContext) {
      // User wants info about himself and he's not authenticated - just return null
      if (!context.auth && !args.id) return null

      await throwForNotHavingServerRole(context, Roles.Server.Guest)

      if (!args.id) await validateScopes(context.scopes, Scopes.Profile.Read)
      else await validateScopes(context.scopes, Scopes.Users.Read)

      if (!args.id && !context.userId) {
        throw new UserInputError('You must provide an user id.')
      }

      return await getUser(args.id || context.userId)
    },

    async adminUsers(
      _parent: never,
      args: { query: string; limit: number; offset: number }
    ) {
      return await getAdminUsersListCollection(args)
    },

    async userSearch(
      parent: never,
      args: {
        query: string
        limit: number
        cursor: string
        archived: boolean
        emailOnly: boolean
      },
      context: AuthContext
    ) {
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Read)
      await validateScopes(context.scopes, Scopes.Users.Read)

      if (args.query.length < 3)
        throw new UserInputError('Search query must be at least 3 carachters.')

      if (args.limit && args.limit > 100)
        throw new UserInputError(
          'Cannot return more than 100 items, please use pagination.'
        )

      const { cursor, users } = await searchUsers(
        args.query,
        args.limit,
        args.cursor,
        args.archived,
        args.emailOnly
      )
      return { cursor, items: users }
    },

    async userPwdStrength(parent: never, args: { pwd: string }) {
      const res = zxcvbn(args.pwd)
      return { score: res.score, feedback: res.feedback }
    }
  },

  User: {
    async email(
      parent: { id: string; email: string },
      args: never,
      context: AuthContext
    ) {
      // NOTE: we're redacting the field (returning null) rather than throwing a full error which would invalidate the request.
      if (context.userId === parent.id) {
        try {
          await validateScopes(context.scopes, Scopes.Profile.Email)
          return parent.email
        } catch (err) {
          return null
        }
      }

      try {
        // you should only have access to other users email if you have elevated privileges
        await throwForNotHavingServerRole(context, Roles.Server.Admin)
        await validateScopes(context.scopes, Scopes.Users.Email)
        return parent.email
      } catch (err) {
        return null
      }
    },
    async role(parent: { id: string }) {
      return await getUserRole(parent.id)
    },
    async isOnboardingFinished(
      parent: { id: string },
      _args: never,
      ctx: {
        loaders: {
          users: {
            getUserMeta: {
              load: ({
                userId,
                key
              }: {
                userId: string
                key: string
              }) => Promise<{ value: unknown }>
            }
          }
        }
      }
    ) {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.id,
        key: UsersMeta.metaKey.isOnboardingFinished
      })
      return !!metaVal?.value
    }
  },
  LimitedUser: {
    async role(parent: { id: string }) {
      return await getUserRole(parent.id)
    }
  },
  Mutation: {
    async userUpdate(
      _parent: never,
      args: { user: UserUpdateInput },
      context: AuthContext
    ) {
      if (!context.userId) return false
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await updateUserAndNotify(context.userId, args.user)
      return true
    },

    async userRoleChange(
      _parent: never,
      args: { userRoleInput: { role: string; id: string } }
    ) {
      const { guestModeEnabled } = await getServerInfo()
      await changeUserRole({
        role: args.userRoleInput.role,
        userId: args.userRoleInput.id,
        guestModeEnabled
      })
      return true
    },

    async adminDeleteUser(
      _parent: never,
      args: { userConfirmation: { email: string } },
      context: AuthContext
    ) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      const user = await getUserByEmail({ email: args.userConfirmation.email })
      if (!user) return false

      await deleteUser(user.id)
      return true
    },

    async userDelete(
      parent: never,
      args: { userConfirmation: { email: string }; user: string },
      context: AuthContext
    ) {
      const user = await getUser(context.userId)

      if (args.userConfirmation.email !== user.email) {
        throw new UserInputError('Malformed input: emails do not match.')
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself.
      // Since I am paranoid, I'll leave them here too.
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Delete)

      await deleteUser(context.userId)

      await saveActivity({
        streamId: null,
        resourceType: 'user',
        resourceId: context.userId || null,
        actionType: ActionTypes.User.Delete,
        userId: context.userId || null,
        info: {},
        message: 'User deleted'
      })

      return true
    },

    activeUserMutations: () => ({})
  },
  ActiveUserMutations: {
    async finishOnboarding(_parent: never, _args: never, ctx: AuthContext) {
      return await markOnboardingComplete(ctx.userId || '')
    },
    async update(
      _parent: never,
      args: { user: UserUpdateInput },
      context: AuthContext
    ) {
      if (!context.userId) throw new UserUpdateError('Attempting to update a null user')
      const newUser = await updateUserAndNotify(context.userId, args.user)
      return newUser
    }
  }
}
