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
