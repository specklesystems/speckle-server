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
import { isUsersMetaFlag, Users, UsersMeta } from '@/modules/core/dbSchema'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import {
  deleteAllUserInvitesFactory,
  countServerInvitesFactory,
  findServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import db from '@/db/knex'
import { BadRequestError, InvalidArgumentError } from '@/modules/shared/errors'
import {
  updateUserAndNotifyFactory,
  deleteUserFactory,
  changeUserRoleFactory
} from '@/modules/core/services/users/management'
import {
  getExplicitProjects,
  getUserDeletableStreamsFactory
} from '@/modules/core/repositories/streams'
import { dbLogger } from '@/observability/logging'
import { getAdminUsersListCollectionFactory } from '@/modules/core/services/users/legacyAdminUsersList'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getMailchimpStatus,
  getMailchimpOnboardingIds
} from '@/modules/shared/helpers/envHelper'
import { updateMailchimpMemberTags } from '@/modules/auth/services/mailchimp'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { metaHelpers } from '@/modules/core/helpers/meta'
import {
  asMultiregionalOperation,
  asOperation,
  replicateFactory
} from '@/modules/shared/command'
import { setUserOnboardingChoicesFactory } from '@/modules/core/services/users/tracking'
import { getMixpanelClient } from '@/modules/shared/utils/mixpanel'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { getUserWorkspaceSeatsFactory } from '@/modules/workspacesCore/repositories/workspaces'
import {
  deleteProjectAndCommitsFactory,
  queryAllProjectsFactory
} from '@/modules/core/services/projects'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'
import { deleteProjectFactory } from '@/modules/core/repositories/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'

const getUser = legacyGetUserFactory({ db })
const getUserByEmail = legacyGetUserByEmailFactory({ db })

const getServerInfo = getServerInfoFactory({ db })

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
    intelligenceCommunityStandUpBannerDismissed: async (parent, _args, ctx) => {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.userId,
        key: UsersMeta.metaKey.intelligenceCommunityStandUpBannerDismissed
      })
      return !!metaVal?.value
    },
    speckleCon25BannerDismissed: async (parent, _args, ctx) => {
      const metaVal = await ctx.loaders.users.getUserMeta.load({
        userId: parent.userId,
        key: UsersMeta.metaKey.speckleCon25BannerDismissed
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

      await asMultiregionalOperation(
        async ({ mainDb, allDbs, emit }) => {
          const updateUserAndNotify = updateUserAndNotifyFactory({
            getUser: getUserFactory({ db: mainDb }),
            updateUser: async (...params) => {
              const [res] = await Promise.all(
                allDbs.map((db) => updateUserFactory({ db })(...params))
              )

              return res
            },
            emitEvent: emit
          })

          return await updateUserAndNotify(context.userId!, args.user)
        },
        {
          dbs: await getAllRegisteredDbs(),
          logger,
          name: 'updateUser',
          description: `Update user`
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

      await asMultiregionalOperation(
        ({ mainDb, allDbs, emit }) => {
          const deleteUser = deleteUserFactory({
            deleteProjectAndCommits: deleteProjectAndCommitsFactory({
              // this is a bit of an overhead, we are issuing delete queries to all regions,
              // instead of being selective and clever about figuring out the project DB and only
              // deleting from main and the project db
              deleteProject: replicateFactory(allDbs, deleteProjectFactory),
              deleteProjectCommits: replicateFactory(
                allDbs,
                deleteProjectCommitsFactory
              )
            }),
            logger: dbLogger,
            isLastAdminUser: isLastAdminUserFactory({ db: mainDb }),
            getUserDeletableStreams: getUserDeletableStreamsFactory({ db: mainDb }),
            queryAllProjects: queryAllProjectsFactory({
              getExplicitProjects: getExplicitProjects({ db: mainDb })
            }),
            getUserWorkspaceSeats: getUserWorkspaceSeatsFactory({ db: mainDb }),
            deleteAllUserInvites: deleteAllUserInvitesFactory({ db: mainDb }),
            deleteUserRecord: async (params) => {
              const [res] = await Promise.all(
                allDbs.map((db) => deleteUserRecordFactory({ db })(params))
              )

              return res
            },
            emitEvent: emit
          })

          return deleteUser(user.id, context.userId)
        },
        {
          logger,
          name: 'adminDeleteUser',
          description: 'Admin deletion of an user',
          dbs: await getAllRegisteredDbs()
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
      await asMultiregionalOperation(
        ({ mainDb, allDbs, emit }) => {
          const deleteUser = deleteUserFactory({
            deleteProjectAndCommits: deleteProjectAndCommitsFactory({
              // this is a bit of an overhead, we are issuing delete queries to all regions,
              // instead of being selective and clever about figuring out the project DB and only
              // deleting from main and the project db
              deleteProject: replicateFactory(allDbs, deleteProjectFactory),
              deleteProjectCommits: replicateFactory(
                allDbs,
                deleteProjectCommitsFactory
              )
            }),
            logger: dbLogger,
            isLastAdminUser: isLastAdminUserFactory({ db: mainDb }),
            getUserDeletableStreams: getUserDeletableStreamsFactory({ db: mainDb }),
            queryAllProjects: queryAllProjectsFactory({
              getExplicitProjects: getExplicitProjects({ db: mainDb })
            }),
            getUserWorkspaceSeats: getUserWorkspaceSeatsFactory({ db: mainDb }),
            deleteAllUserInvites: deleteAllUserInvitesFactory({ db: mainDb }),
            deleteUserRecord: async (params) => {
              const [res] = await Promise.all(
                allDbs.map((db) => deleteUserRecordFactory({ db })(params))
              )

              return res
            },
            emitEvent: emit
          })

          return deleteUser(user.id, context.userId)
        },
        {
          logger,
          name: 'deleteUser',
          description: 'Delete user',
          dbs: await getAllRegisteredDbs()
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

      const newUser = await asMultiregionalOperation(
        async ({ mainDb, allDbs, emit }) => {
          const updateUserAndNotify = updateUserAndNotifyFactory({
            getUser: getUserFactory({ db: mainDb }),
            updateUser: async (...params) => {
              const [res] = await Promise.all(
                allDbs.map((db) => updateUserFactory({ db })(...params))
              )

              return res
            },
            emitEvent: emit
          })

          return await updateUserAndNotify(context.userId!, args.user)
        },
        {
          dbs: await getAllRegisteredDbs(),
          logger,
          name: 'updateUser',
          description: `Update user`
        }
      )

      return newUser
    },
    meta: () => ({})
  },
  UserMetaMutations: {
    setFlag: async (_parent, { key, value }, ctx) => {
      if (!isUsersMetaFlag(key)) {
        throw new InvalidArgumentError(`User flag ${key} is not known.`)
      }

      const meta = metaHelpers(Users, db)
      const res = await meta.set(ctx.userId!, key, value)

      return !!res.value
    },
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
    },
    setIntelligenceCommunityStandUpBannerDismissed: async (_parent, args, ctx) => {
      const meta = metaHelpers(Users, db)
      const res = await meta.set(
        ctx.userId!,
        UsersMeta.metaKey.intelligenceCommunityStandUpBannerDismissed,
        args.value
      )

      return !!res.value
    },
    setSpeckleCon25BannerDismissed: async (_parent, args, ctx) => {
      const meta = metaHelpers(Users, db)
      const res = await meta.set(
        ctx.userId!,
        UsersMeta.metaKey.speckleCon25BannerDismissed,
        args.value
      )

      return !!res.value
    }
  }
} as Resolvers
