import gql from 'graphql-tag'

export const getAvailableRegionKeysQuery = gql`
  query GetAvailableRegionKeys {
    serverInfo {
      multiRegion {
        availableKeys
      }
    }
  }
`
