import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { getStream, grantStreamPermissions } from '@/modules/core/repositories/streams'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import { getStreams } from '@/modules/core/services/streams'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  deleteInviteFactory,
  deleteInvitesByTargetFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  queryAllResourceInvitesFactory,
  queryAllUserResourceInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  cancelResourceInviteFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { getInvitationTargetUsersFactory } from '@/modules/serverinvites/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import {
  WorkspaceNotFoundError,
  WorkspacesNotAuthorizedError,
  WorkspacesNotYetImplementedError
} from '@/modules/workspaces/errors/workspace'
import {
  getWorkspaceCollaboratorsFactory,
  getWorkspaceFactory,
  getWorkspaceRolesFactory,
  getWorkspaceRolesForUserFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  workspaceInviteValidityFilter
} from '@/modules/workspaces/repositories/workspaces'
import {
  buildWorkspaceInviteEmailContentsFactory,
  collectAndValidateWorkspaceTargetsFactory,
  createWorkspaceInviteFactory,
  getPendingWorkspaceCollaboratorsFactory,
  getUserPendingWorkspaceInviteFactory,
  getUserPendingWorkspaceInvitesFactory,
  processFinalizedWorkspaceInviteFactory,
  validateWorkspaceInviteBeforeFinalizationFactory
} from '@/modules/workspaces/services/invites'
import {
  createWorkspaceFactory,
  setWorkspaceRoleFactory,
  updateWorkspaceFactory
} from '@/modules/workspaces/services/management'
import { getWorkspacesForUserFactory } from '@/modules/workspaces/services/retrieval'
import { Roles } from '@speckle/shared'
import { chunk } from 'lodash'

const buildCreateAndSendWorkspaceInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: collectAndValidateWorkspaceTargetsFactory({
      getStream,
      getWorkspace: getWorkspaceFactory({ db })
    }),
    buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
      getStream,
      getWorkspace: getWorkspaceFactory({ db })
    }),
    emitServerInvitesEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      })
  })

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async (_parent, args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(args.id)
          if (!workspace) {
            throw new WorkspaceNotFoundError()
          }

          await authorizeResolver(
            ctx.userId,
            args.id,
            Roles.Workspace.Guest,
            ctx.resourceAccessRules
          )

          return workspace
        },
        workspaceInvite: async (_parent, args, ctx) => {
          const getPendingInvite = getUserPendingWorkspaceInviteFactory({
            findInvite: findInviteFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            getUser
          })

          return await getPendingInvite({
            userId: ctx.userId!,
            token: args.token,
            workspaceId: args.workspaceId
          })
        }
      },
      Mutation: {
        workspaceMutations: () => ({})
      },
      WorkspaceMutations: {
        create: async (_parent, args, context) => {
          const { name, description, logoUrl } = args.input

          const { emit: emitWorkspaceEvent } = getEventBus()

          const upsertWorkspace = upsertWorkspaceFactory({ db })
          const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })
          // TODO: Integrate with blobstorage
          const storeBlob = async () => ''

          const createWorkspace = createWorkspaceFactory({
            upsertWorkspace,
            upsertWorkspaceRole,
            emitWorkspaceEvent,
            storeBlob
          })

          const workspace = await createWorkspace({
            userId: context.userId!,
            workspaceInput: {
              name,
              description: description ?? null,
              logoUrl: logoUrl ?? null
            },
            userResourceAccessLimits: context.resourceAccessRules
          })

          return workspace
        },
        delete: async () => {
          // TODO: Remember to also delete pending workspace invites
          throw new WorkspacesNotYetImplementedError()
        },
        update: async (_parent, args, context) => {
          const { id: workspaceId, ...workspaceInput } = args.input

          const { emit: emitWorkspaceEvent } = getEventBus()

          const getWorkspace = getWorkspaceFactory({ db })
          const upsertWorkspace = upsertWorkspaceFactory({ db })
          // TODO: Integrate with blobstorage
          const storeBlob = async () => ''

          const updateWorkspace = updateWorkspaceFactory({
            getWorkspace,
            upsertWorkspace,
            emitWorkspaceEvent,
            storeBlob
          })

          const workspace = await updateWorkspace({
            workspaceId,
            workspaceInput,
            workspaceUpdaterId: context.userId!,
            updaterResourceAccessLimits: context.resourceAccessRules
          })

          return workspace
        },
        updateRole: async () => {
          throw new WorkspacesNotYetImplementedError()
        },
        deleteRole: async () => {
          throw new WorkspacesNotYetImplementedError()
        },
        invites: () => ({})
      },
      WorkspaceInviteMutations: {
        create: async (_parent, args, ctx) => {
          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })
          await createInvite({
            workspaceId: args.workspaceId,
            input: args.input,
            inviterId: ctx.userId!,
            inviterResourceAccessRules: ctx.resourceAccessRules
          })

          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        },
        batchCreate: async (_parent, args, ctx) => {
          const inviteCount = args.input.length
          if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              'Maximum 10 invites can be sent at once by non admins'
            )
          }

          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })

          const inputBatches = chunk(args.input, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map((i) =>
                createInvite({
                  workspaceId: args.workspaceId,
                  input: i,
                  inviterId: ctx.userId!,
                  inviterResourceAccessRules: ctx.resourceAccessRules
                })
              )
            )
          }

          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        },
        use: async (_parent, args, ctx) => {
          const finalizeInvite = finalizeResourceInviteFactory({
            findInvite: findInviteFactory({ db }),
            deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
            insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
            emitServerInvitesEvent: ({ eventName, payload }) =>
              getEventBus().emit({
                eventName,
                payload
              }),
            validateInvite: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
            processInvite: processFinalizedWorkspaceInviteFactory({
              getWorkspace: getWorkspaceFactory({ db }),
              setWorkspaceRole: setWorkspaceRoleFactory({
                getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                emitWorkspaceEvent: ({ eventName, payload }) =>
                  getEventBus().emit({
                    eventName,
                    payload
                  }),
                getStreams,
                grantStreamPermissions
              })
            })
          })

          await finalizeInvite({
            finalizerUserId: ctx.userId!,
            finalizerResourceAccessLimits: ctx.resourceAccessRules,
            token: args.input.token,
            accept: args.input.accept,
            resourceType: WorkspaceInviteResourceType
          })

          return true
        },
        cancel: async (_parent, args, ctx) => {
          await authorizeResolver(
            ctx.userId,
            args.workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const cancelInvite = cancelResourceInviteFactory({
            findInvite: findInviteFactory({ db }),
            deleteInvite: deleteInviteFactory({ db }),
            validateResourceAccess: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db })
            })
          })

          await cancelInvite({
            resourceId: args.workspaceId,
            inviteId: args.inviteId,
            cancelerId: ctx.userId!,
            resourceType: WorkspaceInviteResourceType,
            cancelerResourceAccessLimits: ctx.resourceAccessRules
          })
          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        }
      },
      Workspace: {
        role: async (parent, _args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(parent.id)
          return workspace?.role || null
        },
        team: async (parent) => {
          const getTeam = getWorkspaceCollaboratorsFactory({ db })
          const collaborators = await getTeam({
            workspaceId: parent.id
          })

          return collaborators
        },
        invitedTeam: async (parent) => {
          const getPendingTeam = getPendingWorkspaceCollaboratorsFactory({
            queryAllResourceInvites: queryAllResourceInvitesFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
          })

          return await getPendingTeam({ workspaceId: parent.id })
        },
        projects: async () => {
          // Get projects in workspace
          throw new WorkspacesNotYetImplementedError()
        }
      },
      WorkspaceCollaborator: {
        user: async (parent) => {
          return parent
        },
        role: async (parent) => {
          return parent.workspaceRole
        }
      },
      PendingWorkspaceCollaborator: {
        workspaceName: async (parent, _args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(
            parent.workspaceId
          )
          return workspace!.name
        },
        invitedBy: async (parent, _args, ctx) => {
          const { invitedById } = parent
          if (!invitedById) return null

          const user = await ctx.loaders.users.getUser.load(invitedById)
          return user ? removePrivateFields(user) : null
        },
        token: async (parent, _args, ctx) => {
          const authedUserId = ctx.userId
          const targetUserId = parent.user?.id
          const inviteId = parent.inviteId

          // Only returning it for the user that is the pending stream collaborator
          if (!authedUserId || !targetUserId || authedUserId !== targetUserId) {
            return null
          }

          const invite = await ctx.loaders.invites.getInvite.load(inviteId)
          return invite?.token || null
        }
      },
      User: {
        workspaces: async (_parent, _args, context) => {
          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const getWorkspace = getWorkspaceFactory({ db })
          const getWorkspaceRolesForUser = getWorkspaceRolesForUserFactory({ db })

          const getWorkspacesForUser = getWorkspacesForUserFactory({
            getWorkspace,
            getWorkspaceRolesForUser
          })

          const workspaces = await getWorkspacesForUser({ userId: context.userId })

          // TODO: Pagination
          return {
            items: workspaces,
            totalCount: workspaces.length
          }
        },
        workspaceInvites: async (parent) => {
          const getInvites = getUserPendingWorkspaceInvitesFactory({
            getUser,
            getUserResourceInvites: queryAllUserResourceInvitesFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            })
          })

          return await getInvites(parent.id)
        }
      },
      Project: {
        workspace: async () => {
          // Get workspaceId from project, get and return workspace data
          throw new WorkspacesNotYetImplementedError()
        }
      },
      AdminQueries: {
        workspaceList: async () => {
          throw new WorkspacesNotYetImplementedError()
        }
      }
    } as Resolvers)
  : {}
