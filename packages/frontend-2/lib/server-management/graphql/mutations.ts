import { graphql } from '~~/lib/common/generated/gql'

export const serverInfoUpdateMutation = graphql(`
  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {
    serverInfoUpdate(info: $info)
  }
`)

export const adminDeleteUserMutation = graphql(`
  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {
    adminDeleteUser(userConfirmation: $userConfirmation)
  }
`)

export const adminDeleteProjectMutation = graphql(`
  mutation AdminPanelDeleteProject($ids: [String!]!) {
    projectMutations {
      batchDelete(ids: $ids)
    }
  }
`)

export const adminResendInviteMutation = graphql(`
  mutation AdminPanelResendInvite($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`)

export const adminDeleteInviteMutation = graphql(`
  mutation AdminPanelDeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`)

export const changeRoleMutation = graphql(`
  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {
    userRoleChange(userRoleInput: $userRoleInput)
  }
`)
