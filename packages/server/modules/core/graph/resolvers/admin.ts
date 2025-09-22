import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import { toProjectIdWhitelist } from '@/modules/core/helpers/token'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import {
  countUsersFactory,
  listUsersFactory,
  updateUserEmailVerificationFactory
} from '@/modules/core/repositories/users'
import {
  adminUpdateEmailVerificationFactory,
  adminInviteListFactory,
  adminProjectListFactory,
  adminUserListFactory
} from '@/modules/core/services/admin'
import { deleteVerificationsFactory } from '@/modules/emails/repositories'
import {
  countServerInvitesFactory,
  queryServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { asOperation } from '@/modules/shared/command'
import {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { ensureError } from '@speckle/shared'

const adminUserList = adminUserListFactory({
  listUsers: listUsersFactory({ db }),
  countUsers: countUsersFactory({ db })
})
const adminInviteList = adminInviteListFactory({
  countServerInvites: countServerInvitesFactory({ db }),
  queryServerInvites: queryServerInvitesFactory({ db })
})
const adminProjectList = adminProjectListFactory({
  getStreams: legacyGetStreamsFactory({ db })
})

export default {
  Query: {
    admin: () => ({})
  },
  AdminQueries: {
    async userList(_parent, { limit, cursor, query, role }) {
      return await adminUserList({
        limit,
        cursor,
        query,
        role: role ? mapServerRoleToValue(role) : null
      })
    },
    async projectList(_parent, args, ctx) {
      return await adminProjectList({
        query: args.query ?? null,
        orderBy: args.orderBy ?? null,
        visibility: args.visibility ?? null,
        limit: args.limit,
        cursor: args.cursor,
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
      })
    },
    serverStatistics: () => ({}),
    async inviteList(_parent, args) {
      return await adminInviteList(args)
    }
  },
  Mutation: {
    admin: () => ({})
  },
  ServerAdminMutations: {
    async updateEmailVerification(_parent, args, ctx) {
      try {
        return await asOperation(
          async ({ db }) => {
            const updateEmailVerification = adminUpdateEmailVerificationFactory({
              deleteVerifications: deleteVerificationsFactory({ db }),
              updateUserEmailVerification: updateUserEmailVerificationFactory({
                db
              }),
              updateUserEmail: updateUserEmailFactory({ db })
            })

            return await updateEmailVerification(args.input)
          },
          {
            logger: ctx.log,
            name: 'adminUpdateEmailVerification',
            description: 'Email verification updated by a server admin'
          }
        )
      } catch (e) {
        const err = ensureError(e, 'Unknown error while updating email verification')
        ctx.log.info({ err }, 'Email verification by Admin failed.')
      }
    }
  },
  ServerStatistics: {
    async totalProjectCount() {
      return await getTotalStreamCountFactory({ db })()
    },

    async totalUserCount() {
      return await getTotalUserCountFactory({ db })()
    },
    async totalPendingInvites() {
      return 0
    }
  }
} as Resolvers
