import { graphql } from '~~/lib/common/generated/gql'

export const onProjectModelsUpdateSubscription = graphql(`
  subscription OnProjectModelsUpdate($id: String!) {
    projectModelsUpdated(id: $id) {
      id
      type
      model {
        id
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)
