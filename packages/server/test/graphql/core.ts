import gql from 'graphql-tag'

export const getAllAvailableScopesQuery = gql`
  query GetAllAvailableScopes {
    serverInfo {
      scopes {
        name
        description
      }
    }
  }
`
