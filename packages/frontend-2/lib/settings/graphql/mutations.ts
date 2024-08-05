import { graphql } from '~~/lib/common/generated/gql'

export const settingsWorkspaceUpdateRoleMutation = graphql(`
  mutation SettingsWorkspaceUpdateRole($input: WorkspaceRoleUpdateInput!) {
    workspaceMutations {
      updateRole(input: $input) {
        id
      }
    }
  }
`)
