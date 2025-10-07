import { graphql } from '~~/lib/common/generated/gql'

export const accSyncItemCreateMutation = graphql(`
  mutation CreateAccSyncItem($input: CreateAccSyncItemInput!) {
    accSyncItemMutations {
      create(input: $input) {
        id
        model {
          id
          name
        }
        author {
          id
          name
        }
        accFileName
        accFileLineageUrn
        accFileViewName
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
