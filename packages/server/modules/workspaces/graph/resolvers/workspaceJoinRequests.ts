import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import {
  countAdminWorkspaceJoinRequestsFactory,
  getAdminWorkspaceJoinRequestsFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'
import { WorkspaceJoinRequestStatus } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequestGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'

export default {
  Query: {
    adminWorkspacesJoinRequests: async (_parent, args, ctx) => {
      const { filter, cursor, limit } = args

      return await getPaginatedItemsFactory<
        {
          limit: number
          cursor?: string
          filter: {
            userId: string
            status?: WorkspaceJoinRequestStatus | null
          }
        },
        WorkspaceJoinRequestGraphQLReturn
      >({
        getItems: getAdminWorkspaceJoinRequestsFactory({ db }),
        getTotalCount: countAdminWorkspaceJoinRequestsFactory({ db })
      })({
        filter: {
          status: filter?.status ?? undefined,
          userId: ctx.userId!
        },
        cursor: cursor ?? undefined,
        limit
      })
    }
  },
  WorkspaceJoinRequest: {
    user: async (parent, _args, ctx) => {
      return await ctx.loaders.users.getUser.load(parent.userId)
    },
    workspace: async (parent, _args, ctx) => {
      return await ctx.loaders.workspaces!.getWorkspace.load(parent.workspaceId)
    }
  }
} as Resolvers
