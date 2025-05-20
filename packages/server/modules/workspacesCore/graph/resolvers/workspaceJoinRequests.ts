import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export default !FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Workspace: {
        adminWorkspacesJoinRequests: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      WorkspaceJoinRequest: {
        id: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        user: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        workspace: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      LimitedWorkspaceJoinRequest: {
        id: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        user: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        workspace: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      User: {
        workspaceJoinRequests: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      Mutation: {
        workspaceJoinRequestMutations: () => {
          throw new WorkspacesModuleDisabledError()
        }
      }
    } as Resolvers)
  : {}
