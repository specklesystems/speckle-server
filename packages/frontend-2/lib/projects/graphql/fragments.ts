import { graphql } from '~~/lib/common/generated/gql'

export const projectDashboardItemNoModelsFragment = graphql(`
  fragment ProjectDashboardItemNoModels on Project {
    id
    name
    createdAt
    updatedAt
    role
    team {
      id
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
    models(limit: 4) {
      totalCount
      items {
        ...ProjectPageLatestItemsModelItem
      }
    }
    workspace {
      id
      slug
      name
      ...WorkspaceAvatar_Workspace
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
    automationsStatus {
      ...AutomateRunsTriggerStatus_TriggeredAutomationsStatus
    }
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

export const projectPageLatestItemsModelsFragment = graphql(`
  fragment ProjectPageLatestItemsModels on Project {
    id
    role
    visibility
    modelCount: models(limit: 0) {
      totalCount
    }
    ...ProjectPageModelsStructureItem_Project
  }
`)

export const projectPageLatestItemsCommentsFragment = graphql(`
  fragment ProjectPageLatestItemsComments on Project {
    id
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
  }
`)

export const projectPageLatestItemsCommentItemFragment = graphql(`
  fragment ProjectPageLatestItemsCommentItem on Comment {
    id
    author {
      ...FormUsersSelectItem
    }
    screenshot
    rawText
    createdAt
    updatedAt
    archived
    repliesCount: replies(limit: 0) {
      totalCount
    }
    replyAuthors(limit: 4) {
      totalCount
      items {
        ...FormUsersSelectItem
      }
    }
  }
`)
