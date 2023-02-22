import { gql } from '@apollo/client/core'

export const streamBranchesSelectorQuery = gql`
  query StreamBranchesSelector($streamId: String!) {
    stream(id: $streamId) {
      id
      branches(limit: 100) {
        items {
          name
        }
      }
    }
  }
`

export const moveCommitsMutation = gql`
  mutation MoveCommits($input: CommitsMoveInput!) {
    commitsMove(input: $input)
  }
`

export const deleteCommitsMutation = gql`
  mutation DeleteCommits($input: CommitsDeleteInput!) {
    commitsDelete(input: $input)
  }
`
