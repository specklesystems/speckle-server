import { gql } from '@apollo/client/core'

export const functionsQuery = gql`
  query StreamFunctions($streamId: String!) {
    stream(id: $streamId) {
      id
      functions
    }
  }
`
