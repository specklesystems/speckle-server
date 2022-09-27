import {
  DeleteCommitsMutation,
  DeleteCommitsMutationVariables,
  MoveCommitsMutation,
  MoveCommitsMutationVariables,
  ReadStreamBranchCommitsQuery,
  ReadStreamBranchCommitsQueryVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'
import { ApolloServer, gql } from 'apollo-server-express'

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
            id
            authorName
            authorId
            authorAvatar
            sourceApplication
            message
            referencedObject
            createdAt
            commentCount
          }
        }
      }
    }
  }
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
