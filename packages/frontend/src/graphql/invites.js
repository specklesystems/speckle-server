import gql from 'graphql-tag'
import { limitedUserFieldsFragment } from '@/graphql/fragments/user'

export const streamInviteQuery = gql`
  query StreamInvite($streamId: String!, $inviteId: String) {
    streamInvite(streamId: $streamId, inviteId: $inviteId) {
      id
      inviteId
      invitedBy {
        ...LimitedUserFields
      }
    }
  }

  ${limitedUserFieldsFragment}
`

export const useStreamInviteMutation = gql`
  mutation UseStreamInvite($accept: Boolean!, $streamId: String!, $inviteId: String!) {
    streamInviteUse(accept: $accept, streamId: $streamId, inviteId: $inviteId)
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
