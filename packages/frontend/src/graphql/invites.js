import { gql } from '@apollo/client/core'
import { usersOwnInviteFieldsFragment } from '@/graphql/fragments/user'

export const streamInviteQuery = gql`
  query StreamInvite($streamId: String!, $token: String) {
    streamInvite(streamId: $streamId, token: $token) {
      ...UsersOwnInviteFields
    }
  }

  ${usersOwnInviteFieldsFragment}
`

export const userStreamInvitesQuery = gql`
  query UserStreamInvites {
    streamInvites {
      ...UsersOwnInviteFields
    }
  }

  ${usersOwnInviteFieldsFragment}
`

export const useStreamInviteMutation = gql`
  mutation UseStreamInvite($accept: Boolean!, $streamId: String!, $token: String!) {
    streamInviteUse(accept: $accept, streamId: $streamId, token: $token)
  }
`

export const cancelStreamInviteMutation = gql`
  mutation CancelStreamInvite($streamId: String!, $inviteId: String!) {
    streamInviteCancel(streamId: $streamId, inviteId: $inviteId)
  }
`

export const deleteInviteMutation = gql`
  mutation DeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`

export const resendInviteMutation = gql`
  mutation ResendInvite($inviteId: String!) {
    inviteResend(inviteId: $inviteId)
  }
`

export const batchInviteToServerMutation = gql`
  mutation BatchInviteToServer($paramsArray: [ServerInviteCreateInput!]!) {
    serverInviteBatchCreate(input: $paramsArray)
  }
`

export const batchInviteToStreamsMutation = gql`
  mutation BatchInviteToStreams($paramsArray: [StreamInviteCreateInput!]!) {
    streamInviteBatchCreate(input: $paramsArray)
  }
`
