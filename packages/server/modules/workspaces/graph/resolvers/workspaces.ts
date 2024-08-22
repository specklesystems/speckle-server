import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  getStream,
  grantStreamPermissions,
  revokeStreamPermissions
} from '@/modules/core/repositories/streams'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import { getStreams } from '@/modules/core/services/streams'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  deleteAllResourceInvitesFactory,
  deleteInviteFactory,
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  markInviteUpdatedfactory,
  queryAllResourceInvitesFactory,
  queryAllUserResourceInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import {
  createAndSendInviteFactory,
  resendInviteEmailFactory
} from '@/modules/serverinvites/services/creation'
import {
  cancelResourceInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { createProjectInviteFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { getInvitationTargetUsersFactory } from '@/modules/serverinvites/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  WORKSPACE_MAX_PROJECTS_VERSIONS,
  WorkspaceInviteResourceType
} from '@/modules/workspaces/domain/constants'
import {
  WorkspaceInvalidRoleError,
  WorkspaceNotFoundError,
  WorkspacesNotAuthorizedError,
  WorkspacesNotYetImplementedError
} from '@/modules/workspaces/errors/workspace'
import { isWorkspaceRole } from '@/modules/workspaces/helpers/roles'
import {
  deleteWorkspaceFactory as repoDeleteWorkspaceFactory,
  deleteWorkspaceRoleFactory as repoDeleteWorkspaceRoleFactory,
  getWorkspaceCollaboratorsFactory,
  getWorkspaceFactory,
  getWorkspaceRolesFactory,
  getWorkspaceRolesForUserFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  workspaceInviteValidityFilter,
  countProjectsVersionsByWorkspaceIdFactory
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
  deleteWorkspaceFactory,
  deleteWorkspaceRoleFactory,
  updateWorkspaceFactory,
  updateWorkspaceRoleFactory
} from '@/modules/workspaces/services/management'
import {
  getWorkspaceProjectsFactory,
  queryAllWorkspaceProjectsFactory
} from '@/modules/workspaces/services/projects'
import { getWorkspacesForUserFactory } from '@/modules/workspaces/services/retrieval'
import { Roles, WorkspaceRoles, removeNullOrUndefinedKeys } from '@speckle/shared'
import { chunk } from 'lodash'
import { deleteStream } from '@/modules/core/repositories/streams'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerification } from '@/modules/emails/services/verification/request'
import { Workspace } from '@/modules/workspacesCore/domain/types'

const buildCreateAndSendServerOrProjectInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
      getStream
    }),
    emitEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      })
  })

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
    emitEvent: ({ eventName, payload }) =>
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
      ProjectInviteMutations: {
        async createForWorkspace(_parent, args, ctx) {
          await authorizeResolver(
            ctx.userId,
            args.projectId,
            Roles.Stream.Owner,
            ctx.resourceAccessRules
          )

          const inviteCount = args.inputs.length
          if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              'Maximum 10 invites can be sent at once by non admins'
            )
          }

          const createProjectInvite = createProjectInviteFactory({
            createAndSendInvite: buildCreateAndSendServerOrProjectInvite()
          })

          const inputBatches = chunk(args.inputs, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map((i) => {
                const workspaceRole = i.workspaceRole
                if (
                  workspaceRole &&
                  !(Object.values(Roles.Workspace) as string[]).includes(workspaceRole)
                ) {
                  throw new InviteCreateValidationError(
                    'Invalid workspace role specified: ' + workspaceRole
                  )
                }

                return createProjectInvite({
                  input: {
                    ...i,
                    projectId: args.projectId
                  },
                  inviterId: ctx.userId!,
                  inviterResourceAccessRules: ctx.resourceAccessRules,
                  secondaryResourceRoles: workspaceRole
                    ? {
                        [WorkspaceInviteResourceType]: workspaceRole as WorkspaceRoles
                      }
                    : undefined
                })
              })
            )
          }
          return ctx.loaders.streams.getStream.load(args.projectId)
        }
      },
      WorkspaceMutations: {
        create: async (_parent, args, context) => {
          const { name, description, defaultLogoIndex } = args.input

          const createWorkspace = createWorkspaceFactory({
            upsertWorkspace: upsertWorkspaceFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })

          const workspace = await createWorkspace({
            userId: context.userId!,
            workspaceInput: {
              name,
              description: description || null,
              logo: null,
              defaultLogoIndex: defaultLogoIndex || 0
            },
            userResourceAccessLimits: context.resourceAccessRules
          })

          return workspace
        },
        delete: async (_parent, args, context) => {
          const { workspaceId } = args

          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          // Delete workspace and associated resources (i.e. invites)
          const deleteWorkspace = deleteWorkspaceFactory({
            deleteWorkspace: repoDeleteWorkspaceFactory({ db }),
            deleteProject: deleteStream,
            deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
            queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams })
          })

          await deleteWorkspace({ workspaceId })

          return true
        },
        update: async (_parent, args, context) => {
          const { id: workspaceId, ...workspaceInput } = args.input

          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const updateWorkspace = updateWorkspaceFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            upsertWorkspace: upsertWorkspaceFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })

          const workspace = await updateWorkspace({
            workspaceId,
            workspaceInput
          })

          return workspace
        },
        updateRole: async (_parent, args, context) => {
          const { userId, workspaceId, role } = args.input

          await authorizeResolver(
            context.userId,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const getWorkspaceRoles = getWorkspaceRolesFactory({ db })
          const emitWorkspaceEvent = getEventBus().emit

          if (!role) {
            const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
              deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db }),
              getWorkspaceRoles,
              emitWorkspaceEvent,
              getStreams,
              revokeStreamPermissions
            })

            await deleteWorkspaceRole(args.input)
          } else {
            if (!isWorkspaceRole(role)) {
              throw new WorkspaceInvalidRoleError()
            }

            const updateWorkspaceRole = updateWorkspaceRoleFactory({
              upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
              getWorkspaceRoles,
              emitWorkspaceEvent,
              getStreams,
              grantStreamPermissions
            })

            await updateWorkspaceRole({ userId, workspaceId, role })
          }

          return await getWorkspaceFactory({ db })({ workspaceId })
        },
        leave: async (_parent, args, ctx) => {
          const userId = ctx.userId!

          const getWorkspaceRoles = getWorkspaceRolesFactory({ db })
          const emitWorkspaceEvent = getEventBus().emit

          const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
            deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db }),
            getWorkspaceRoles,
            emitWorkspaceEvent,
            getStreams,
            revokeStreamPermissions
          })

          await deleteWorkspaceRole({ workspaceId: args.id, userId })

          return true
        },
        invites: () => ({})
      },
      WorkspaceInviteMutations: {
        resend: async (_parent, args, ctx) => {
          const {
            input: { inviteId, workspaceId }
          } = args

          await authorizeResolver(
            ctx.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const resendInviteEmail = resendInviteEmailFactory({
            buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
              getStream,
              getWorkspace: getWorkspaceFactory({ db })
            }),
            findUserByTarget: findUserByTargetFactory(),
            findInvite: findInviteFactory({ db }),
            markInviteUpdated: markInviteUpdatedfactory({ db })
          })

          await resendInviteEmail({
            inviteId,
            resourceFilter: {
              resourceType: WorkspaceInviteResourceType,
              resourceId: workspaceId
            }
          })

          return true
        },
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
            emitEvent: ({ eventName, payload }) =>
              getEventBus().emit({
                eventName,
                payload
              }),
            validateInvite: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
            processInvite: processFinalizedWorkspaceInviteFactory({
              getWorkspace: getWorkspaceFactory({ db }),
              updateWorkspaceRole: updateWorkspaceRoleFactory({
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
            }),
            findEmail: findEmailFactory({ db }),
            validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
              createUserEmail: createUserEmailFactory({ db }),
              ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
              findEmail: findEmailFactory({ db }),
              updateEmailInvites: finalizeInvitedServerRegistrationFactory({
                deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
                updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
              }),
              requestNewEmailVerification
            })
          })

          await finalizeInvite({
            finalizerUserId: ctx.userId!,
            finalizerResourceAccessLimits: ctx.resourceAccessRules,
            token: args.input.token,
            accept: args.input.accept,
            resourceType: WorkspaceInviteResourceType,
            allowAttachingNewEmail: args.input.addNewEmail ?? undefined
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
        team: async (parent, args) => {
          const getTeam = getWorkspaceCollaboratorsFactory({ db })
          const collaborators = await getTeam({
            workspaceId: parent.id,
            filter: removeNullOrUndefinedKeys(args?.filter ?? {})
          })

          return collaborators
        },
        invitedTeam: async (parent, args) => {
          const getPendingTeam = getPendingWorkspaceCollaboratorsFactory({
            queryAllResourceInvites: queryAllResourceInvitesFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
          })

          return await getPendingTeam({ workspaceId: parent.id, filter: args.filter })
        },
        projects: async (parent, args) => {
          const getWorkspaceProjects = getWorkspaceProjectsFactory({ getStreams })
          return await getWorkspaceProjects(
            {
              workspaceId: parent.id
            },
            {
              limit: args.limit || 25,
              cursor: args.cursor || null,
              filter: { ...(args.filter || {}) }
            }
          )
        },
        billing: (parent) => ({ parent })
      },
      WorkspaceBilling: {
        version: async (parent) => {
          return {
            current: await countProjectsVersionsByWorkspaceIdFactory({ db })({
              workspaceId: (parent as { parent: Workspace }).parent.id
            }),
            max: WORKSPACE_MAX_PROJECTS_VERSIONS
          }
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
          // If it was specified with the request, just return it
          if (parent.token?.length) return parent.token

          const authedUserId = ctx.userId
          const targetUserId = parent.user?.id
          const inviteId = parent.inviteId

          // Only returning it for the user that is the pending stream collaborator
          if (!authedUserId || !targetUserId || authedUserId !== targetUserId) {
            return null
          }

          const invite = await ctx.loaders.invites.getInvite.load(inviteId)
          return invite?.token || null
        },
        email: async (parent, _args, ctx) => {
          if (!parent.user) return parent.email

          // TODO: Tests to check token & email access?

          const token = parent.token
          const authedUserId = ctx.userId
          const targetUserId = parent.user?.id

          // Only returning it for the user that is the pending stream collaborator
          // OR if the token was specified
          if (
            (!authedUserId || !targetUserId || authedUserId !== targetUserId) &&
            !token
          ) {
            return null
          }

          return parent.email
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
