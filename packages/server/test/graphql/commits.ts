import {
  DeleteCommitsMutation,
  DeleteCommitsMutationVariables,
  MoveCommitsMutation,
  MoveCommitsMutationVariables,
  ReadOtherUsersCommitsQuery,
  ReadOtherUsersCommitsQueryVariables,
  ReadOwnCommitsQuery,
  ReadOwnCommitsQueryVariables,
  ReadStreamBranchCommitsQuery,
  ReadStreamBranchCommitsQueryVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'
import { ApolloServer, gql } from 'apollo-server-express'

const baseCommitFieldsFragment = gql`
  fragment BaseCommitFields on Commit {
    id
    authorName
    authorId
    authorAvatar
    streamId
    streamName
    sourceApplication
    message
    referencedObject
    createdAt
    commentCount
  }
`

const readOwnCommitsQuery = gql`
  query ReadOwnCommits($cursor: String, $limit: Int! = 10) {
    activeUser {
      commits(limit: $limit, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...BaseCommitFields
        }
      }
    }
  }

  ${baseCommitFieldsFragment}
`

const readOtherUsersCommitsQuery = gql`
  query ReadOtherUsersCommits($userId: String!, $cursor: String, $limit: Int! = 10) {
    otherUser(id: $userId) {
      commits(limit: $limit, cursor: $cursor) {
        totalCount
        cursor
        items {
          ...BaseCommitFields
          stream {
            id
            name
            isPublic
          }
        }
      }
    }
  }

  ${baseCommitFieldsFragment}
`

const readStreamBranchCommitsQuery = gql`
  query ReadStreamBranchCommits(
    $streamId: String!
    $branchName: String!
    $cursor: String
    $limit: Int! = 10
  ) {
    stream(id: $streamId) {
      id
      name
      role
      branch(name: $branchName) {
        id
        name
        description
        commits(cursor: $cursor, limit: $limit) {
          totalCount
          cursor
          items {
            ...BaseCommitFields
          }
        }
      }
    }
  }

  ${baseCommitFieldsFragment}
`

const moveCommitsMutation = gql`
  mutation MoveCommits($input: CommitsMoveInput!) {
    commitsMove(input: $input)
  }
`

const deleteCommitsMutation = gql`
  mutation DeleteCommits($input: CommitsDeleteInput!) {
    commitsDelete(input: $input)
  }
`

export const readOwnCommits = (
  apollo: ApolloServer,
  variables: ReadOwnCommitsQueryVariables
) =>
  executeOperation<ReadOwnCommitsQuery, ReadOwnCommitsQueryVariables>(
    apollo,
    readOwnCommitsQuery,
    variables
  )

export const readOtherUsersCommits = (
  apollo: ApolloServer,
  variables: ReadOtherUsersCommitsQueryVariables
) =>
  executeOperation<ReadOtherUsersCommitsQuery, ReadOtherUsersCommitsQueryVariables>(
    apollo,
    readOtherUsersCommitsQuery,
    variables
  )

export const readStreamBranchCommits = (
  apollo: ApolloServer,
  variables: ReadStreamBranchCommitsQueryVariables
) =>
  executeOperation<ReadStreamBranchCommitsQuery, ReadStreamBranchCommitsQueryVariables>(
    apollo,
    readStreamBranchCommitsQuery,
    variables
  )

export const moveCommits = (
  apollo: ApolloServer,
  variables: MoveCommitsMutationVariables
) =>
  executeOperation<MoveCommitsMutation, MoveCommitsMutationVariables>(
    apollo,
    moveCommitsMutation,
    variables
  )

export const deleteCommits = (
  apollo: ApolloServer,
  variables: DeleteCommitsMutationVariables
) =>
  executeOperation<DeleteCommitsMutation, DeleteCommitsMutationVariables>(
    apollo,
    deleteCommitsMutation,
    variables
  )
