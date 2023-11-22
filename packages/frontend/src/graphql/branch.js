import { gql } from '@apollo/client/core'

export const branchCreatedSubscription = gql`
  subscription BranchCreated($streamId: String!) {
    branchCreated(streamId: $streamId)
  }
`
// TODO: Reusable composable
export const streamNavBranchesQuery = gql`
  query StreamAllBranches($streamId: String!, $cursor: String) {
    stream(id: $streamId) {
      id
      branches(limit: 500, cursor: $cursor) {
        totalCount
        cursor
        items {
          id
          name
          description
          author {
            id
            name
          }
          commits {
            totalCount
          }
          createdAt
        }
      }
    }
  }
`
