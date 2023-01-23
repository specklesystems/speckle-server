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

export const onProjectVersionsUpdateSubscription = graphql(`
  subscription OnProjectVersionsUpdate($id: String!) {
    projectVersionsUpdated(id: $id) {
      id
      modelId
      type
      version {
        id
        model {
          id
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const onVersionPreviewGeneratedSubscription = graphql(`
  subscription OnVersionPreviewGenerated($versionId: String!) {
    versionPreviewGenerated(id: $versionId)
  }
`)
