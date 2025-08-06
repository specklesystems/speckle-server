import { graphql } from '~~/lib/common/generated/gql'

export const onProjectAccSyncItemUpdatedSubscription = graphql(`
  subscription OnProjectAccSyncItemUpdated($id: String!, $itemIds: [String!]) {
    projectAccSyncItemsUpdated(id: $id, itemIds: $itemIds) {
      type
      accSyncItem {
        ...ProjectAccSyncItem
      }
    }
  }
`)
