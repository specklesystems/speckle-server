import { graphql } from '~~/lib/common/generated/gql'

export const inviteServerUserMutation = graphql(`
  mutation InviteServerUser($input: [ServerInviteCreateInput!]!) {
    serverInviteBatchCreate(input: $input)
  }
`)
