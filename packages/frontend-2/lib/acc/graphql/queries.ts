import { graphql } from '~~/lib/common/generated/gql'

export const projectAccSyncItemsQuery = graphql(`
  query ProjectAccSyncItems($id: String!) {
    project(id: $id) {
      accSyncItems {
        items {
          ...ProjectAccSyncItem
        }
      }
    }
  }
`)
