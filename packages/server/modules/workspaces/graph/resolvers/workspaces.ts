import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { WorkspacesNotYetImplementedError } from '@/modules/workspaces/errors/workspace'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async () => {
          // Get workspace by id
          throw new WorkspacesNotYetImplementedError()
        }
      },
      WorkspaceMutations: {
        create: async () => {
          throw new WorkspacesNotYetImplementedError()
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
  : null
