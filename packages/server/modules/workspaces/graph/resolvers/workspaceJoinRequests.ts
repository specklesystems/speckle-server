import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { findEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'
import { getUserFactory } from '@/modules/core/repositories/users'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { commandFactory } from '@/modules/shared/command'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import {
  ApproveWorkspaceJoinRequest,
  DenyWorkspaceJoinRequest
} from '@/modules/workspaces/domain/operations'
import {
  countAdminWorkspaceJoinRequestsFactory,
  getAdminWorkspaceJoinRequestsFactory,
  getWorkspaceJoinRequestFactory,
  updateWorkspaceJoinRequestStatusFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'
import {
  getWorkspaceFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { sendWorkspaceJoinRequestApprovedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/approved'
import { sendWorkspaceJoinRequestDeniedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/denied'
import {
  approveWorkspaceJoinRequestFactory,
  denyWorkspaceJoinRequestFactory
} from '@/modules/workspaces/services/workspaceJoinRequests'
import { WorkspaceJoinRequestStatus } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequestGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'

const eventBus = getEventBus()

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
    id: async (parent) => {
      return parent.userId + parent.workspaceId
    },
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
      const approveWorkspaceJoinRequest = commandFactory<ApproveWorkspaceJoinRequest>({
        db,
        eventBus,
        operationFactory: ({ db, emit }) => {
          const updateWorkspaceJoinRequestStatus =
            updateWorkspaceJoinRequestStatusFactory({
              db
            })
          const sendWorkspaceJoinRequestApprovedEmail =
            sendWorkspaceJoinRequestApprovedEmailFactory({
              renderEmail,
              sendEmail,
              getServerInfo: getServerInfoFactory({ db }),
              getUserEmails: findEmailsByUserIdFactory({ db })
            })
          return approveWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestApprovedEmail,
            getUserById: getUserFactory({ db }),
            getWorkspace: getWorkspaceFactory({ db }),
            getWorkspaceJoinRequest: getWorkspaceJoinRequestFactory({
              db
            }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emit
          })
        }
      })
      return await approveWorkspaceJoinRequest({
        userId: args.input.userId,
        workspaceId: args.input.workspaceId
      })
    },
    deny: async (_parent, args) => {
      const denyWorkspaceJoinRequest = commandFactory<DenyWorkspaceJoinRequest>({
        db,
        operationFactory: ({ db }) => {
          const updateWorkspaceJoinRequestStatus =
            updateWorkspaceJoinRequestStatusFactory({
              db
            })
          const sendWorkspaceJoinRequestDeniedEmail =
            sendWorkspaceJoinRequestDeniedEmailFactory({
              renderEmail,
              sendEmail,
              getServerInfo: getServerInfoFactory({ db }),
              getUserEmails: findEmailsByUserIdFactory({ db })
            })

          return denyWorkspaceJoinRequestFactory({
            updateWorkspaceJoinRequestStatus,
            sendWorkspaceJoinRequestDeniedEmail,
            getUserById: getUserFactory({ db }),
            getWorkspace: getWorkspaceFactory({ db }),
            getWorkspaceJoinRequest: getWorkspaceJoinRequestFactory({
              db
            })
          })
        }
      })

      return await denyWorkspaceJoinRequest({
        userId: args.input.userId,
        workspaceId: args.input.workspaceId
      })
    }
  }
} as Resolvers
