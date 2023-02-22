import { basicStreamAccessRequestFieldsFragment } from '@/graphql/fragments/accessRequests'
import { gql } from '@apollo/client/core'

export const getStreamAccessRequestQuery = gql`
  query GetStreamAccessRequest($streamId: String!) {
    streamAccessRequest(streamId: $streamId) {
      ...BasicStreamAccessRequestFields
    }
  }

  ${basicStreamAccessRequestFieldsFragment}
`

export const createStreamAccessRequestMutation = gql`
  mutation CreateStreamAccessRequest($streamId: String!) {
    streamAccessRequestCreate(streamId: $streamId) {
      ...BasicStreamAccessRequestFields
    }
  }

  ${basicStreamAccessRequestFieldsFragment}
`

export const useStreamAccessRequestMutation = gql`
  mutation UseStreamAccessRequest(
    $requestId: String!
    $accept: Boolean!
    $role: StreamRole = STREAM_CONTRIBUTOR
  ) {
    streamAccessRequestUse(requestId: $requestId, accept: $accept, role: $role)
  }
`
