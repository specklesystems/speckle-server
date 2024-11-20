import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import { toProjectIdWhitelist } from '@/modules/core/helpers/token'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { countUsersFactory, listUsersFactory } from '@/modules/core/repositories/users'
import {
  adminInviteListFactory,
  adminProjectListFactory,
  adminUserListFactory
} from '@/modules/core/services/admin'
import {
  countServerInvitesFactory,
  queryServerInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories'

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

export = {
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
