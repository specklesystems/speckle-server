import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import {
  adminInviteList,
  adminProjectList,
  adminUserList
} from '@/modules/core/services/admin'
import { getTotalStreamCount, getTotalUserCount } from '@/modules/stats/services'

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
    async projectList(_parent, args) {
      return await adminProjectList({
        query: args.query ?? null,
        orderBy: args.orderBy ?? null,
        visibility: args.visibility ?? null,
        limit: args.limit,
        cursor: args.cursor
      })
    },
    serverStatistics: () => ({}),
    async inviteList(_parent, args) {
      return await adminInviteList(args)
    }
  },
  ServerStatistics: {
    async totalProjectCount() {
      return await getTotalStreamCount()
    },

    async totalUserCount() {
      return await getTotalUserCount()
    },
    async totalPendingInvites() {
      return 0
    }
  }
} as Resolvers
