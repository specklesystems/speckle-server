import {
  LeaveStreamMutation,
  LeaveStreamMutationVariables,
  CreateStreamMutation,
  CreateStreamMutationVariables,
  UpdateStreamMutationVariables,
  UpdateStreamMutation,
  ReadStreamQueryVariables,
  ReadStreamQuery,
  ReadDiscoverableStreamsQueryVariables,
  ReadDiscoverableStreamsQuery
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'
import { ApolloServer, gql } from 'apollo-server-express'

export const basicStreamFieldsFragment = gql`
  fragment BasicStreamFields on Stream {
    id
    name
    description
    isPublic
    isDiscoverable
    allowPublicComments
    role
    createdAt
    updatedAt
  }
`

const leaveStreamMutation = gql`
  mutation LeaveStream($streamId: String!) {
    streamLeave(streamId: $streamId)
  }
`

const createStreamMutation = gql`
  mutation CreateStream($stream: StreamCreateInput!) {
    streamCreate(stream: $stream)
  }
`

const updateStreamMutation = gql`
  mutation UpdateStream($stream: StreamUpdateInput!) {
    streamUpdate(stream: $stream)
  }
`

const readStreamQuery = gql`
  query ReadStream($id: String!) {
    stream(id: $id) {
      ...BasicStreamFields
    }
  }

  ${basicStreamFieldsFragment}
`

const readDiscoverableStreamsQuery = gql`
  query ReadDiscoverableStreams(
    $limit: Int! = 25
    $cursor: String
    $sort: DiscoverableStreamsSortingInput
  ) {
    discoverableStreams(limit: $limit, cursor: $cursor, sort: $sort) {
      totalCount
      cursor
      items {
        favoritesCount
        ...BasicStreamFields
      }
    }
  }

  ${basicStreamFieldsFragment}
`

export const leaveStream = (
  apollo: ApolloServer,
  variables: LeaveStreamMutationVariables
) =>
  executeOperation<LeaveStreamMutation, LeaveStreamMutationVariables>(
    apollo,
    leaveStreamMutation,
    variables
  )

export const createStream = (
  apollo: ApolloServer,
  variables: CreateStreamMutationVariables
) =>
  executeOperation<CreateStreamMutation, CreateStreamMutationVariables>(
    apollo,
    createStreamMutation,
    variables
  )

export const updateStream = (
  apollo: ApolloServer,
  variables: UpdateStreamMutationVariables
) =>
  executeOperation<UpdateStreamMutation, UpdateStreamMutationVariables>(
    apollo,
    updateStreamMutation,
    variables
  )

export const readStream = (apollo: ApolloServer, variables: ReadStreamQueryVariables) =>
  executeOperation<ReadStreamQuery, ReadStreamQueryVariables>(
    apollo,
    readStreamQuery,
    variables
  )

export const readDiscoverableStreams = (
  apollo: ApolloServer,
  variables: ReadDiscoverableStreamsQueryVariables
) =>
  executeOperation<ReadDiscoverableStreamsQuery, ReadDiscoverableStreamsQueryVariables>(
    apollo,
    readDiscoverableStreamsQuery,
    variables
  )
