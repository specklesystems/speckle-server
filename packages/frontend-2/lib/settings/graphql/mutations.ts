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

export const settingsUpdateWorkspaceSecurity = graphql(`
  mutation SettingsUpdateWorkspaceSecurity($input: WorkspaceUpdateInput!) {
    workspaceMutations {
      update(input: $input) {
        domainBasedMembershipProtectionEnabled
        discoverabilityEnabled
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

export const settingsAddWorkspaceDomainMutation = graphql(`
  mutation AddWorkspaceDomain($input: AddDomainToWorkspaceInput!) {
    workspaceMutations {
      addDomain(input: $input) {
        domains {
          id
          domain
        }
      }
    }
  }
`)

export const settingsDeleteWorkspaceDomainMutation = graphql(`
  mutation DeleteWorkspaceDomain($input: WorkspaceDomainDeleteInput!) {
    workspaceMutations {
      deleteDomain(input: $input) {
        domains {
          id
          domain
        }
      }
    }
  }
`)
