import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export = !FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async () => {
          throw new WorkspacesModuleDisabledError()
        },

        workspaceBySlug: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        workspaceInvite: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      Mutation: {
        workspaceMutations: () => ({})
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
        addDomain: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        deleteDomain: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        join: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        leave: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        setDefaultRegion: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        invites: () => ({})
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
        },
        resend: async () => {
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
        },
        domains: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      User: {
        discoverableWorkspaces: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        workspaces: async () => {
          throw new WorkspacesModuleDisabledError()
        },
        workspaceInvites: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      Project: {
        workspace: async () => {
          // Return type is always workspace or null, to make the FE implementation easier we force return null in this case
          return null
        }
      },
      AdminQueries: {
        workspaceList: async () => {
          throw new WorkspacesModuleDisabledError()
        }
      },
      LimitedUser: {
        workspaceDomainPolicyCompliant: async () => null
      },
      ServerInfo: {
        workspaces: () => ({})
      },
      ServerWorkspacesInfo: {
        workspacesEnabled: () => false
      }
    } as Resolvers)
  : {}
