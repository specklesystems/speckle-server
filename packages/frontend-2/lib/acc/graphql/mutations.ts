import { graphql } from '~~/lib/common/generated/gql'

export const accSyncItemCreateMutation = graphql(`
  mutation CreateAccSyncItem($input: CreateAccSyncItemInput!) {
    accSyncItemMutations {
      create(input: $input) {
        id
        accFileLineageUrn
        status
      }
    }
  }
`)

export const accSyncItemDeleteMutation = graphql(`
  mutation DeleteAccSyncItem($input: DeleteAccSyncItemInput!) {
    accSyncItemMutations {
      delete(input: $input)
    }
  }
`)

export const accSyncItemUpdateMutation = graphql(`
  mutation UpdateAccSyncItem($input: UpdateAccSyncItemInput!) {
    accSyncItemMutations {
      update(input: $input) {
        id
        status
      }
    }
  }
`)
