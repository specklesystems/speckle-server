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

export const settingsResendWorkspaceInviteMutation = graphql(`
  mutation SettingsResendWorkspaceInvite($input: WorkspaceInviteResendInput!) {
    workspaceMutations {
      invites {
        resend(input: $input)
      }
    }
  }
`)

export const settingsCancelWorkspaceInviteMutation = graphql(`
  mutation SettingsCancelWorkspaceInvite($workspaceId: String!, $inviteId: String!) {
    workspaceMutations {
      invites {
        cancel(workspaceId: $workspaceId, inviteId: $inviteId) {
          id
        }
      }
    }
  }
`)

export const settingsLeaveWorkspaceMutation = graphql(`
  mutation SettingsLeaveWorkspace($leaveId: ID!) {
    workspaceMutations {
      leave(id: $leaveId)
    }
  }
`)
