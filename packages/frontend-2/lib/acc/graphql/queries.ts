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

export const projectAccSyncItemByModelIdQuery = graphql(`
  query ProjectAccSyncItemsByModelId($id: String!, $modelId: String!) {
    project(id: $id) {
      accSyncItemByModelId(modelId: $modelId) {
        ...ProjectAccSyncItem
      }
    }
  }
`)
