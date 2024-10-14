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
  ReadDiscoverableStreamsQuery,
  GetUserStreamsQueryVariables,
  GetUserStreamsQuery,
  GetLimitedUserStreamsQuery,
  GetLimitedUserStreamsQueryVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation, ExecuteOperationServer } from '@/test/graphqlHelper'
import gql from 'graphql-tag'

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

export const readStreamsQuery = gql`
  query ReadStreams {
    streams {
      cursor
      totalCount
      items {
        ...BasicStreamFields
      }
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

/**
 * @deprecated Leaving this behind while we still have the old user() query. This should
 * be deleted afterwards
 */
const getUserStreamsQuery = gql`
  query GetUserStreams($userId: String, $limit: Int! = 25, $cursor: String) {
    user(id: $userId) {
      streams(limit: $limit, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...BasicStreamFields
        }
      }
    }
  }

  ${basicStreamFieldsFragment}
`

const getLimitedUserStreamsQuery = gql`
  query GetLimitedUserStreams($userId: String!, $limit: Int! = 25, $cursor: String) {
    otherUser(id: $userId) {
      streams(limit: $limit, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...BasicStreamFields
        }
      }
    }
  }

  ${basicStreamFieldsFragment}
`

export const leaveStream = (
  apollo: ExecuteOperationServer,
  variables: LeaveStreamMutationVariables
) =>
  executeOperation<LeaveStreamMutation, LeaveStreamMutationVariables>(
    apollo,
    leaveStreamMutation,
    variables
  )

export const createStream = (
  apollo: ExecuteOperationServer,
  variables: CreateStreamMutationVariables
) =>
  executeOperation<CreateStreamMutation, CreateStreamMutationVariables>(
    apollo,
    createStreamMutation,
    variables
  )

export const updateStream = (
  apollo: ExecuteOperationServer,
  variables: UpdateStreamMutationVariables
) =>
  executeOperation<UpdateStreamMutation, UpdateStreamMutationVariables>(
    apollo,
    updateStreamMutation,
    variables
  )

export const readStream = (
  apollo: ExecuteOperationServer,
  variables: ReadStreamQueryVariables
) =>
  executeOperation<ReadStreamQuery, ReadStreamQueryVariables>(
    apollo,
    readStreamQuery,
    variables
  )

export const readDiscoverableStreams = (
  apollo: ExecuteOperationServer,
  variables: ReadDiscoverableStreamsQueryVariables
) =>
  executeOperation<ReadDiscoverableStreamsQuery, ReadDiscoverableStreamsQueryVariables>(
    apollo,
    readDiscoverableStreamsQuery,
    variables
  )

export const getUserStreams = (
  apollo: ExecuteOperationServer,
  variables: GetUserStreamsQueryVariables
) =>
  executeOperation<GetUserStreamsQuery, GetUserStreamsQueryVariables>(
    apollo,
    getUserStreamsQuery,
    variables
  )

export const getLimitedUserStreams = (
  apollo: ExecuteOperationServer,
  variables: GetLimitedUserStreamsQueryVariables
) =>
  executeOperation<GetLimitedUserStreamsQuery, GetLimitedUserStreamsQueryVariables>(
    apollo,
    getLimitedUserStreamsQuery,
    variables
  )
