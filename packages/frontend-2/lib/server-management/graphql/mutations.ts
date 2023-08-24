import { graphql } from '~~/lib/common/generated/gql'

export const adminDeleteProject = graphql(`
  mutation AdminPanelDeleteProject($ids: [String!]) {
    streamsDelete(ids: $ids)
  }
`)

export const adminResendInvite = graphql(`
  mutation AdminPanelResendInvite($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`)

export const adminDeleteInvite = graphql(`
  mutation AdminPanelDeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`)

export const changeRoleMutation = graphql(`
  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {
    userRoleChange(userRoleInput: $userRoleInput)
  }
`)
