import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  WorkspacesNotAuthorizedError,
  WorkspacesNotYetImplementedError
} from '@/modules/workspaces/errors/workspace'
import {
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { createWorkspaceFactory } from '@/modules/workspaces/services/management'
import db from '@/db/knex'
import { getEventBus } from '@/modules/shared/services/eventBus'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async () => {
          // Get workspace by id
          throw new WorkspacesNotYetImplementedError()
        }
      },
      Mutation: {
        workspaceMutations: () => ({})
      },
      WorkspaceMutations: {
        create: async (_parent, args, context) => {
          const { name, description, logoUrl } = args.input

          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const { emit: emitWorkspaceEvent } = getEventBus()

          const upsertWorkspace = upsertWorkspaceFactory({ db })
          const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })
          // TODO: ???
          const storeBlob = async () => ''

          const createWorkspace = createWorkspaceFactory({
            upsertWorkspace,
            upsertWorkspaceRole,
            emitWorkspaceEvent,
            storeBlob
          })

          const workspace = await createWorkspace({
            userId: context.userId,
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
        update: async () => {
          throw new WorkspacesNotYetImplementedError()
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
        workspaces: async () => {
          // Get roles for user, get workspaces
          throw new WorkspacesNotYetImplementedError()
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
