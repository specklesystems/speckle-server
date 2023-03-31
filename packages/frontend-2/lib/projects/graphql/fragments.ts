import { graphql } from '~~/lib/common/generated/gql'

export const projectDashboardItemNoModelsFragment = graphql(`
  fragment ProjectDashboardItemNoModels on Project {
    id
    name
    createdAt
    updatedAt
    role
    team {
      user {
        id
        name
        avatar
      }
    }
    ...ProjectPageModelsCardProject
  }
`)

export const projectDashboardItemFragment = graphql(`
  fragment ProjectDashboardItem on Project {
    id
    ...ProjectDashboardItemNoModels
    models(limit: 4, filter: { onlyWithVersions: true }) {
      totalCount
      items {
        ...ProjectPageLatestItemsModelItem
      }
    }
    pendingImportedModels(limit: 4) {
      ...ProjectPageLatestItemsPendingModelItem
    }
  }
`)

export const projectPageLatestItemsPendingModelItemFragment = graphql(`
  fragment ProjectPageLatestItemsPendingModelItem on FileUpload {
    id
    projectId
    modelName
    convertedStatus
    convertedMessage
    uploadDate
    convertedLastUpdate
  }
`)

export const projectPageLatestItemsModelItemFragment = graphql(`
  fragment ProjectPageLatestItemsModelItem on Model {
    id
    name
    displayName
    versionCount: versions(limit: 0) {
      totalCount
    }
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
    previewUrl
    createdAt
    updatedAt
    ...ProjectPageModelsCardRenameDialog
    ...ProjectPageModelsCardDeleteDialog
    ...ProjectPageModelsActions
  }
`)

export const projectUpdatableMetadataFragment = graphql(`
  fragment ProjectUpdatableMetadata on Project {
    id
    name
    description
    visibility
    allowPublicComments
  }
`)
