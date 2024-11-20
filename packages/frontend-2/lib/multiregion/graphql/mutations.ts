import { graphql } from '~/lib/common/generated/gql'

export const createNewRegionMutation = graphql(`
  mutation CreateNewRegion($input: CreateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        create(input: $input) {
          id
          ...SettingsServerRegionsAddEditDialog_ServerRegionItem
          ...SettingsServerRegionsTable_ServerRegionItem
        }
      }
    }
  }
`)

export const updateRegionMutation = graphql(`
  mutation UpdateRegion($input: UpdateServerRegionInput!) {
    serverInfoMutations {
      multiRegion {
        update(input: $input) {
          id
          ...SettingsServerRegionsAddEditDialog_ServerRegionItem
          ...SettingsServerRegionsTable_ServerRegionItem
        }
      }
    }
  }
`)
