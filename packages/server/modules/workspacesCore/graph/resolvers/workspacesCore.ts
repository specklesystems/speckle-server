import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = !FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      WorkspaceMutations: {
        create: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        delete: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        update: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        updateRole: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        deleteRole: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      WorkspaceInviteMutations: {
        create: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        batchCreate: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        use: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        cancel: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      Workspace: {
        role: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        team: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        invitedTeam: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        projects: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      User: {
        workspaces: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      Project: {
        workspace: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      AdminQueries: {
        workspaceList: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      }
    } as Resolvers)
  : {}
