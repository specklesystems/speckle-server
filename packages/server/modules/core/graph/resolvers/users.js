const {
  getUserRole,
  deleteUser,
  searchUsers,
  changeUserRole
} = require('@/modules/core/services/users')
const { ActionTypes } = require('@/modules/activitystream/helpers/types')
const { validateScopes } = require(`@/modules/shared`)
const zxcvbn = require('zxcvbn')
const {
  getAdminUsersListCollection,
  getTotalCounts
} = require('@/modules/core/services/users/adminUsersListService')
const { Roles, Scopes } = require('@speckle/shared')
const {
  markOnboardingComplete,
  legacyGetUserFactory,
  legacyGetUserByEmailFactory,
  getUserFactory,
  updateUserFactory
} = require('@/modules/core/repositories/users')
const { UsersMeta } = require('@/modules/core/dbSchema')
const { getServerInfo } = require('@/modules/core/services/generic')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const {
  deleteAllUserInvitesFactory,
  countServerInvitesFactory,
  findServerInvitesFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const db = require('@/db/knex')
const { BadRequestError } = require('@/modules/shared/errors')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const {
  updateUserAndNotifyFactory
} = require('@/modules/core/services/users/management')
const {
  addUserUpdatedActivityFactory
} = require('@/modules/activitystream/services/userActivity')

const getUser = legacyGetUserFactory({ db })
const getUserByEmail = legacyGetUserByEmailFactory({ db })

const updateUserAndNotify = updateUserAndNotifyFactory({
  getUser: getUserFactory({ db }),
  updateUser: updateUserFactory({ db }),
  addUserUpdatedActivity: addUserUpdatedActivityFactory({
    saveActivity: saveActivityFactory({ db })
  })
})

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Query: {
    async _() {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    },
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
    async user(parent, args, context) {
      // User wants info about himself and he's not authenticated - just return null
      if (!context.auth && !args.id) return null

      await throwForNotHavingServerRole(context, Roles.Server.Guest)

      if (!args.id) await validateScopes(context.scopes, Scopes.Profile.Read)
      else await validateScopes(context.scopes, Scopes.Users.Read)

      if (!args.id && !context.userId) {
        throw new BadRequestError('You must provide an user id.')
      }

      return await getUser(args.id || context.userId)
    },

    async adminUsers(_parent, args) {
      return await getAdminUsersListCollection({
        findServerInvites: findServerInvitesFactory({ db }),
        getTotalCounts: getTotalCounts({
          countServerInvites: countServerInvitesFactory({ db })
        })
      })(args)
    },

    async userSearch(parent, args, context) {
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
        args.cursor,
        args.archived,
        args.emailOnly
      )
      return { cursor, items: users }
    },

    async userPwdStrength(parent, args) {
      const res = zxcvbn(args.pwd)
      return { score: res.score, feedback: res.feedback }
    }
  },

  User: {
    async email(parent, args, context) {
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
      await updateUserAndNotify(context.userId, args.user)
      return true
    },

    async userRoleChange(_parent, args) {
      const { guestModeEnabled } = await getServerInfo()
      await changeUserRole({
        role: args.userRoleInput.role,
        userId: args.userRoleInput.id,
        guestModeEnabled
      })
      return true
    },

    async adminDeleteUser(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      const user = await getUserByEmail({ email: args.userConfirmation.email })
      if (!user) return false

      await deleteUser({
        deleteAllUserInvites: deleteAllUserInvitesFactory({ db })
      })(user.id)
      return true
    },

    async userDelete(parent, args, context) {
      const user = await getUser(context.userId)

      if (args.userConfirmation.email !== user.email) {
        throw new BadRequestError('Malformed input: emails do not match.')
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself.
      // Since I am paranoid, I'll leave them here too.
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Profile.Delete)

      await deleteUser({
        deleteAllUserInvites: deleteAllUserInvitesFactory({ db })
      })(context.userId, args.user)

      await saveActivityFactory({ db })({
        streamId: null,
        resourceType: 'user',
        resourceId: context.userId,
        actionType: ActionTypes.User.Delete,
        userId: context.userId,
        info: {},
        message: 'User deleted'
      })

      return true
    },

    activeUserMutations: () => ({})
  },
  ActiveUserMutations: {
    async finishOnboarding(_parent, _args, ctx) {
      return await markOnboardingComplete(ctx.userId || '')
    },
    async update(_parent, args, context) {
      const newUser = await updateUserAndNotify(context.userId, args.user)
      return newUser
    }
  }
}
