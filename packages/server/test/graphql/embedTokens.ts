import gql from 'graphql-tag'

export const createEmbedTokenMutation = gql`
  mutation CreateEmbedToken($token: EmbedTokenCreateInput!) {
    projectMutations {
      createEmbedToken(token: $token) {
        token
      }
    }
  }
`
