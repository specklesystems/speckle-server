import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  WorkspaceNotFoundError,
  WorkspacesNotAuthorizedError,
  WorkspacesNotYetImplementedError
} from '@/modules/workspaces/errors/workspace'
import {
  getWorkspaceFactory,
  getWorkspaceRolesForUserFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  createWorkspaceFactory,
  updateWorkspaceFactory
} from '@/modules/workspaces/services/management'
import db from '@/db/knex'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getWorkspacesForUserFactory } from '@/modules/workspaces/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = FF_WORKSPACES_MODULE_ENABLED
  ? ({
    Query: {
      workspace: async (_parent, args) => {
        const { id: workspaceId } = args

        // TODO: Use dataloader
        const workspace = await getWorkspaceFactory({ db })({ workspaceId })

        if (!workspace) {
          throw new WorkspaceNotFoundError()
        }

        return workspace
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
          }
        })

        return workspace
      },
      delete: async () => {
        throw new WorkspacesNotYetImplementedError()
      },
      update: async (_parent, args, context) => {
        const { id: workspaceId, ...workspaceInput } = args.input

        await authorizeResolver(
          context.userId,
          workspaceId,
          Roles.Workspace.Admin
        )

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

        const workspace = await updateWorkspace({ workspaceId, workspaceInput })

        return workspace
      },
      updateRole: async () => {
        throw new WorkspacesNotYetImplementedError()
      },
      deleteRole: async () => {
        throw new WorkspacesNotYetImplementedError()
      }
    },
    WorkspaceInviteMutations: {
      create: async () => {
        throw new WorkspacesNotYetImplementedError()
      },
      batchCreate: async () => {
        throw new WorkspacesNotYetImplementedError()
      },
      use: async () => {
        throw new WorkspacesNotYetImplementedError()
      },
      cancel: async () => {
        throw new WorkspacesNotYetImplementedError()
      }
    },
    Workspace: {
      role: async () => {
        // Get user id from parent, get role and return
        throw new WorkspacesNotYetImplementedError()
      },
      team: async () => {
        // Get roles for workspace
        throw new WorkspacesNotYetImplementedError()
      },
      invitedTeam: async () => {
        // Get invites
        throw new WorkspacesNotYetImplementedError()
      },
      projects: async () => {
        // Get projects in workspace
        throw new WorkspacesNotYetImplementedError()
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
