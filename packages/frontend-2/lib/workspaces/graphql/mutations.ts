import { graphql } from '~~/lib/common/generated/gql'

export const workspaceUpdateRoleMutation = graphql(`
  mutation UpdateRole($input: WorkspaceRoleUpdateInput!) {
    workspaceMutations {
      updateRole(input: $input) {
        team {
          items {
            id
            role
          }
        }
      }
    }
  }
`)

export const inviteToWorkspaceMutation = graphql(`
  mutation InviteToWorkspace(
    $workspaceId: String!
    $input: [WorkspaceInviteCreateInput!]!
  ) {
    workspaceMutations {
      invites {
        batchCreate(workspaceId: $workspaceId, input: $input) {
          id
          invitedTeam {
            ...SettingsWorkspacesMembersInvitesTable_PendingWorkspaceCollaborator
          }
        }
      }
    }
  }
`)

export const createWorkspaceMutation = graphql(`
  mutation CreateWorkspace($input: WorkspaceCreateInput!) {
    workspaceMutations {
      create(input: $input) {
        id
        ...SettingsDialog_Workspace
      }
    }
  }
`)

export const processWorkspaceInviteMutation = graphql(`
  mutation ProcessWorkspaceInvite($input: WorkspaceInviteUseInput!) {
    workspaceMutations {
      invites {
        use(input: $input)
      }
    }
  }
`)

export const setDefaultRegionMutation = graphql(`
  mutation SetDefaultWorkspaceRegion($workspaceId: String!, $regionKey: String!) {
    workspaceMutations {
      setDefaultRegion(workspaceId: $workspaceId, regionKey: $regionKey) {
        id
        defaultRegion {
          id
          ...SettingsWorkspacesRegionsSelect_ServerRegionItem
        }
      }
    }
  }
`)
