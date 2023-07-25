import { Resolvers, ServerRole } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import { adminProjectList, adminUserList } from '@/modules/core/services/admin'
import { getTotalStreamCount, getTotalUserCount } from '@/modules/stats/services'

type CursorAndLimit = {
  cursor: string | null
  limit: number
}

type Query = {
  query: string | null
}

type UserListArgs = CursorAndLimit &
  Query & {
    role: ServerRole | null
  }

type ProjectListArgs = CursorAndLimit &
  Query & {
    orderBy: string
    visibility: string
  }

export = {
  Query: {
    admin: () => ({})
  },
  AdminQueries: {
    async userList(_parent, { limit, cursor, query, role }: UserListArgs) {
      return await adminUserList({
        limit,
        cursor,
        query,
        role: mapServerRoleToValue(role)
      })
    },
    // async inviteList() {

    // }
    async projectList(_parent, args: ProjectListArgs) {
      return await adminProjectList(args)
    },
    serverStatistics: () => ({})
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
