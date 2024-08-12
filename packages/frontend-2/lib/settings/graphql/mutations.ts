import { graphql } from '~~/lib/common/generated/gql'

export const settingsUpdateWorkspaceMutation = graphql(`
  mutation SettingsUpdateWorkspace($input: WorkspaceUpdateInput!) {
    workspaceMutations {
      update(input: $input) {
        ...SettingsWorkspacesGeneral_Workspace
      }
    }
  }
`)
export const settingsCreateUserEmailMutation = graphql(`
  mutation SettingsCreateUserEmail($input: CreateUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        create(input: $input) {
          ...SettingsUserEmails_User
        }
      }
    }
  }
`)

export const settingsDeleteUserEmailMutation = graphql(`
  mutation SettingsDeleteUserEmail($input: DeleteUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        delete(input: $input) {
          ...SettingsUserEmails_User
        }
      }
    }
  }
`)

export const settingsSetPrimaryUserEmailMutation = graphql(`
  mutation SettingsSetPrimaryUserEmail($input: SetPrimaryUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        setPrimary(input: $input) {
          ...SettingsUserEmails_User
        }
      }
    }
  }
`)

export const settingsNewEmailVerificationMutation = graphql(`
  mutation SettingsNewEmailVerification($input: EmailVerificationRequestInput!) {
    activeUserMutations {
      emailMutations {
        requestNewEmailVerification(input: $input)
      }
    }
  }
`)

export const deleteWorkspaceMutation = graphql(`
  mutation SettingsDeleteWorkspace($workspaceId: String!) {
    workspaceMutations {
      delete(workspaceId: $workspaceId)
    }
  }
`)
