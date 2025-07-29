import { graphql } from '~~/lib/common/generated/gql'

export const onProjectAccSyncItemUpdatedSubscription = graphql(`
  subscription OnProjectAccSyncItemUpdated($id: String!, $itemUrns: [String!]) {
    projectAccSyncItemsUpdated(id: $id, itemUrns: $itemIds) {
      type
      accSyncItem {
        ...ProjectAccSyncItem
      }
    }
  }
`)
