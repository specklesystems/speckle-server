import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory
} from '@/modules/core/repositories/userEmails'
import { getUserFactory } from '@/modules/core/repositories/users'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  createWorkspaceSeatFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { authorizeResolver } from '@/modules/shared'
import { commandFactory } from '@/modules/shared/command'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import type {
  ApproveWorkspaceJoinRequest,
  DenyWorkspaceJoinRequest
} from '@/modules/workspaces/domain/operations'
import {
  countAdminWorkspaceJoinRequestsFactory,
  countWorkspaceJoinRequestsFactory,
  getAdminWorkspaceJoinRequestsFactory,
  getWorkspaceJoinRequestFactory,
  getWorkspaceJoinRequestsFactory,
  updateWorkspaceJoinRequestStatusFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'
import {
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { addOrUpdateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { sendWorkspaceJoinRequestApprovedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/approved'
import { sendWorkspaceJoinRequestDeniedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/denied'
import {
  approveWorkspaceJoinRequestFactory,
  denyWorkspaceJoinRequestFactory
} from '@/modules/workspaces/services/workspaceJoinRequests'
import {
  assignWorkspaceSeatFactory,
  ensureValidWorkspaceRoleSeatFactory,
  getWorkspaceDefaultSeatTypeFactory
} from '@/modules/workspaces/services/workspaceSeat'
import type { WorkspaceJoinRequestStatus } from '@/modules/workspacesCore/domain/types'
import type { WorkspaceJoinRequestGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { Roles } from '@speckle/shared'

const eventBus = getEventBus()

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export default FF_WORKSPACES_MODULE_ENABLED
  ? ({
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
        email: async (parent, _args, ctx) => {
          const hasAccessToEmail = await ctx.authPolicies.workspace.canReadMemberEmail({
            workspaceId: parent.workspaceId,
            userId: ctx.userId
          })
          if (!hasAccessToEmail.isOk) return null
          return parent.email
        },
        workspace: async (parent, _args, ctx) => {
          return await ctx.loaders.workspaces!.getWorkspace.load(parent.workspaceId)
        }
      },
      LimitedWorkspaceJoinRequest: {
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
      User: {
        workspaceJoinRequests: async (parent, args) => {
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
            getItems: getWorkspaceJoinRequestsFactory({ db }),
            getTotalCount: countWorkspaceJoinRequestsFactory({ db })
          })({
            filter: {
              userId: parent.id,
              status: filter?.status ?? undefined
            },
            cursor: cursor ?? undefined,
            limit
          })
        }
      },
      Mutation: {
        workspaceJoinRequestMutations: () => ({})
      },
      WorkspaceJoinRequestMutations: {
        approve: async (_parent, args, ctx) => {
          const workspaceId = args.input.workspaceId
          const targetUserId = args.input.userId
          const logger = ctx.log.child({
            workspaceId,
            targetUserId
          })

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const approveWorkspaceJoinRequest =
            commandFactory<ApproveWorkspaceJoinRequest>({
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
                  emit,
                  addOrUpdateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
                    getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                      db
                    }),
                    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                    emitWorkspaceEvent: emit,
                    ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
                      createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                      getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
                      getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
                        getWorkspace: getWorkspaceFactory({ db })
                      }),
                      eventEmit: emit
                    }),
                    assignWorkspaceSeat: assignWorkspaceSeatFactory({
                      createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                      getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({
                        db
                      }),
                      eventEmit: emit,
                      getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db })
                    })
                  })
                })
              }
            })
          return await withOperationLogging(
            async () =>
              await approveWorkspaceJoinRequest({
                userId: targetUserId,
                workspaceId,
                approvedByUserId: ctx.userId!
              }),
            {
              logger,
              operationName: 'approveWorkspaceJoinRequest',
              operationDescription: 'Approve workspace join request'
            }
          )
        },
        deny: async (_parent, args, ctx) => {
          const workspaceId = args.input.workspaceId
          const targetUserId = args.input.userId
          const logger = ctx.log.child({
            workspaceId,
            targetUserId
          })

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

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

          return await withOperationLogging(
            async () =>
              await denyWorkspaceJoinRequest({
                userId: args.input.userId,
                workspaceId: args.input.workspaceId
              }),
            {
              logger,
              operationName: 'denyWorkspaceJoinRequest',
              operationDescription: 'Deny workspace join request'
            }
          )
        }
      }
    } as Resolvers)
  : {}
