import gql from 'graphql-tag'

export const mainRegionMetadataFragment = gql`
  fragment MainRegionMetadata on ServerRegionItem {
    id
    key
    name
    description
  }
`

export const getAvailableRegionKeysQuery = gql`
  query GetAvailableRegionKeys {
    serverInfo {
      multiRegion {
        availableKeys
      }
    }
  }
`

export const createRegionMutation = gql`
  mutation CreateNewRegion($input: CreateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        create(input: $input) {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`

export const getRegionsQuery = gql`
  query GetRegions {
    serverInfo {
      multiRegion {
        regions {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`

export const updateRegionMutation = gql`
  mutation UpdateRegion($input: UpdateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        update(input: $input) {
          ...MainRegionMetadata
        }
      }
    }
  }

  ${mainRegionMetadataFragment}
`
