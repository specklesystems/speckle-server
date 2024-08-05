import { graphql } from '~~/lib/common/generated/gql'

export const workspaceUpdateRoleMutation = graphql(`
  mutation WorkspaceUpdateRole($input: WorkspaceRoleUpdateInput!) {
    workspaceMutations {
      updateRole(input: $input) {
        role
        id
      }
    }
  }
`)
