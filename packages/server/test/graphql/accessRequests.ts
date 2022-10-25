import {
  CreateStreamAccessRequestMutation,
  CreateStreamAccessRequestMutationVariables,
  GetFullStreamAccessRequestQuery,
  GetFullStreamAccessRequestQueryVariables,
  GetPendingStreamAccessRequestsQuery,
  GetPendingStreamAccessRequestsQueryVariables,
  GetStreamAccessRequestQuery,
  GetStreamAccessRequestQueryVariables,
  UseStreamAccessRequestMutation,
  UseStreamAccessRequestMutationVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'
import { ApolloServer, gql } from 'apollo-server-express'

const basicStreamAccessRequestFragment = gql`
  fragment BasicStreamAccessRequestFields on StreamAccessRequest {
    id
    requester {
      id
      name
    }
    requesterId
    streamId
    createdAt
  }
`

const createStreamAccessRequestMutation = gql`
  mutation CreateStreamAccessRequest($streamId: String!) {
    streamAccessRequestCreate(streamId: $streamId) {
      ...BasicStreamAccessRequestFields
    }
  }

  ${basicStreamAccessRequestFragment}
`

const getStreamAccessRequestQuery = gql`
  query GetStreamAccessRequest($streamId: String!) {
    streamAccessRequest(streamId: $streamId) {
      ...BasicStreamAccessRequestFields
    }
  }

  ${basicStreamAccessRequestFragment}
`

const getFullStreamAccessRequestQuery = gql`
  query GetFullStreamAccessRequest($streamId: String!) {
    streamAccessRequest(streamId: $streamId) {
      ...BasicStreamAccessRequestFields
      stream {
        id
        name
      }
    }
  }

  ${basicStreamAccessRequestFragment}
`

const getPendingStreamAccessRequestsQuery = gql`
  query GetPendingStreamAccessRequests($streamId: String!) {
    stream(id: $streamId) {
      id
      name
      pendingAccessRequests {
        ...BasicStreamAccessRequestFields
        stream {
          id
          name
        }
      }
    }
  }

  ${basicStreamAccessRequestFragment}
`

const useStreamAccessRequestMutation = gql`
  mutation UseStreamAccessRequest(
    $requestId: String!
    $accept: Boolean!
    $role: StreamRole! = STREAM_CONTRIBUTOR
  ) {
    streamAccessRequestUse(requestId: $requestId, accept: $accept, role: $role)
  }
`

export const createStreamAccessRequest = (
  apollo: ApolloServer,
  variables: CreateStreamAccessRequestMutationVariables
) =>
  executeOperation<
    CreateStreamAccessRequestMutation,
    CreateStreamAccessRequestMutationVariables
  >(apollo, createStreamAccessRequestMutation, variables)

export const getStreamAccessRequest = (
  apollo: ApolloServer,
  variables: GetStreamAccessRequestQueryVariables
) =>
  executeOperation<GetStreamAccessRequestQuery, GetStreamAccessRequestQueryVariables>(
    apollo,
    getStreamAccessRequestQuery,
    variables
  )

export const getFullStreamAccessRequest = (
  apollo: ApolloServer,
  variables: GetFullStreamAccessRequestQueryVariables
) =>
  executeOperation<
    GetFullStreamAccessRequestQuery,
    GetFullStreamAccessRequestQueryVariables
  >(apollo, getFullStreamAccessRequestQuery, variables)

export const getPendingStreamAccessRequests = (
  apollo: ApolloServer,
  variables: GetPendingStreamAccessRequestsQueryVariables
) =>
  executeOperation<
    GetPendingStreamAccessRequestsQuery,
    GetPendingStreamAccessRequestsQueryVariables
  >(apollo, getPendingStreamAccessRequestsQuery, variables)

export const useStreamAccessRequest = (
  apollo: ApolloServer,
  variables: UseStreamAccessRequestMutationVariables
) =>
  executeOperation<
    UseStreamAccessRequestMutation,
    UseStreamAccessRequestMutationVariables
  >(apollo, useStreamAccessRequestMutation, variables)
