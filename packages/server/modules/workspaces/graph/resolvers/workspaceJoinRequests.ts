import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { findEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'
import { getUserFactory } from '@/modules/core/repositories/users'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import {
  countAdminWorkspaceJoinRequestsFactory,
  getAdminWorkspaceJoinRequestsFactory,
  getWorkspaceJoinRequestFactory,
  updateWorkspaceJoinRequestStatusFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { sendWorkspaceJoinRequestApprovedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/approved'
import { approveWorkspaceJoinRequestFactory } from '@/modules/workspaces/services/workspaceJoinRequests'
import { WorkspaceJoinRequestStatus } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequestGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'

export default {
  Workspace: {
    adminWorkspacesJoinRequests: async (parent, args, ctx) => {
      const { filter, cursor, limit } = args

      return await getPaginatedItemsFactory<
        {
          limit: number
          cursor?: string
          filter: {
            workspaceId: string
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
          workspaceId: parent.id,
          status: filter?.status ?? undefined,
          userId: ctx.userId! // This is the worskpace admin, not the request userId
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
  },
  Mutation: {
    workspaceJoinRequestMutations: () => ({})
  },
  WorkspaceJoinRequestMutations: {
    approve: async (_parent, args) => {
      const transaction = await db.transaction()
      const updateWorkspaceJoinRequestStatus = updateWorkspaceJoinRequestStatusFactory({
        db: transaction
      })
      const sendWorkspaceJoinRequestApprovedEmail =
        sendWorkspaceJoinRequestApprovedEmailFactory({
          renderEmail,
          sendEmail,
          getServerInfo: getServerInfoFactory({ db: transaction }),
          getUserEmails: findEmailsByUserIdFactory({ db: transaction })
        })

      return await withTransaction(
        approveWorkspaceJoinRequestFactory({
          updateWorkspaceJoinRequestStatus,
          sendWorkspaceJoinRequestApprovedEmail,
          getUserById: getUserFactory({ db: transaction }),
          getWorkspace: getWorkspaceFactory({ db: transaction }),
          getWorkspaceJoinRequest: getWorkspaceJoinRequestFactory({ db: transaction })
        })({
          userId: args.input.userId,
          workspaceId: args.input.workspaceId
        }),
        transaction
      )
    }
  }
} as Resolvers
