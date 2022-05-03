'use strict'
const { UserInputError } = require('apollo-server-express')
const {
  getUser,
  getUserByEmail,
  getUsers,
  countUsers,
  getUserRole,
  updateUser,
  deleteUser,
  searchUsers,
  getUserById,
  makeUserAdmin,
  unmakeUserAdmin,
  archiveUser
} = require('../../services/users')
const { saveActivity } = require('@/modules/activitystream/services')
const { validateServerRole, validateScopes } = require(`@/modules/shared`)
const zxcvbn = require('zxcvbn')

module.exports = {
  Query: {
    async _() {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    },

    async user(parent, args, context) {
      // User wants info about himself and he's not authenticated - just return null
      if (!context.auth && !args.id) return null

      await validateServerRole(context, 'server:user')

      if (!args.id) await validateScopes(context.scopes, 'profile:read')
      else await validateScopes(context.scopes, 'users:read')

      if (!args.id && !context.userId) {
        throw new UserInputError('You must provide an user id.')
      }

      return await getUser(args.id || context.userId)
    },

    async users(parent, args, context) {
      await validateServerRole(context, 'server:admin')
      await validateScopes(context.scopes, 'users:read')
      const users = await getUsers(args.limit, args.offset, args.query)
      const totalCount = await countUsers(args.query)
      return { totalCount, items: users }
    },

    async userSearch(parent, args, context) {
      await validateServerRole(context, 'server:user')
      await validateScopes(context.scopes, 'profile:read')
      await validateScopes(context.scopes, 'users:read')

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
        args.archived
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
          await validateScopes(context.scopes, 'profile:email')
          return parent.email
        } catch (err) {
          return null
        }
      }

      try {
        await validateScopes(context.scopes, 'users:email')
        return parent.email
      } catch (err) {
        return null
      }
    },

    async role(parent) {
      return await getUserRole(parent.id)
    }
  },

  Mutation: {
    async userUpdate(parent, args, context) {
      await validateServerRole(context, 'server:user')

      const oldValue = await getUserById({ userId: context.userId })

      await updateUser(context.userId, args.user)

      await saveActivity({
        streamId: null,
        resourceType: 'user',
        resourceId: context.userId,
        actionType: 'user_update',
        userId: context.userId,
        info: { old: oldValue, new: args.user },
        message: 'User updated'
      })

      return true
    },

    async userRoleChange(parent, args) {
      const roleChangers = {
        'server:admin': makeUserAdmin,
        'server:user': unmakeUserAdmin,
        'server:archived-user': archiveUser
      }
      const roleChanger = roleChangers[args.userRoleInput.role]
      await roleChanger({ userId: args.userRoleInput.id })
      return true
    },

    async adminDeleteUser(parent, args, context) {
      await validateServerRole(context, 'server:admin')
      const user = await getUserByEmail({ email: args.userConfirmation.email })
      await deleteUser(user.id)
      return true
    },

    async userDelete(parent, args, context) {
      const user = await getUser(context.userId)

      if (args.userConfirmation.email !== user.email) {
        throw new UserInputError('Malformed input: emails do not match.')
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself.
      // Since I am paranoid, I'll leave them here too.
      await validateServerRole(context, 'server:user')
      await validateScopes(context.scopes, 'profile:delete')

      await deleteUser(context.userId, args.user)

      await saveActivity({
        streamId: null,
        resourceType: 'user',
        resourceId: context.userId,
        actionType: 'user_delete',
        userId: context.userId,
        info: {},
        message: 'User deleted'
      })

      return true
    }
  }
}
