import { graphql } from '~~/lib/common/generated/gql'

export const changeRoleMutation = graphql(`
  mutation SettingsChangeUseRole($userRoleInput: UserRoleInput!) {
    userRoleChange(userRoleInput: $userRoleInput)
  }
`)

export const settingsWorkspaceUpdateRoleMutation = graphql(`
  mutation SettingsWorkspaceUpdateRol($input: WorkspaceRoleUpdateInput!) {
    workspaceMutations {
      updateRole(input: $input) {
        id
      }
    }
  }
`)
