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
      ...PendingFileUpload
    }
  }
`)

export const pendingFileUploadFragment = graphql(`
  fragment PendingFileUpload on FileUpload {
    id
    projectId
    modelName
    convertedStatus
    convertedMessage
    uploadDate
    convertedLastUpdate
    fileType
    fileName
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
    pendingImportedVersions(limit: 1) {
      ...PendingFileUpload
    }
    previewUrl
    createdAt
    updatedAt
    ...ProjectPageModelsCardRenameDialog
    ...ProjectPageModelsCardDeleteDialog
    ...ProjectPageModelsActions
    ...ModelCardAutomationStatus_Model
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
