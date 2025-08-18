import { graphql } from '~~/lib/common/generated/gql'

export const projectPageTeamDialogFragment = graphql(`
  fragment ProjectPageTeamDialog on Project {
    id
    name
    role
    allowPublicComments
    visibility
    team {
      id
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    invitedTeam {
      id
      title
      inviteId
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    ...ProjectsPageTeamDialogManagePermissions_Project
  }
`)

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
    ...ProjectCardImportFileArea_Project
    models(limit: 3) {
      totalCount
      items {
        ...ProjectPageLatestItemsModelItem
      }
    }
    workspace {
      id
      slug
      name
      logo
      readOnly
    }
    pendingImportedModels(limit: 3) {
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
    userId
    updatedAt
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
    ...ProjectPageModelsCard_Model
    ...ProjectPageModelsCardRenameDialog
    ...ProjectPageModelsCardDeleteDialog
    ...ProjectPageModelsActions
    ...ProjectCardImportFileArea_Model
    automationsStatus {
      ...AutomateRunsTriggerStatus_TriggeredAutomationsStatus
    }
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
      canDelete {
        ...FullPermissionCheckResult
      }
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
    permissions {
      canRead {
        ...FullPermissionCheckResult
      }
      canUpdate {
        ...FullPermissionCheckResult
      }
      canUpdateAllowPublicComments {
        ...FullPermissionCheckResult
      }
      canReadSettings {
        ...FullPermissionCheckResult
      }
      canReadWebhooks {
        ...FullPermissionCheckResult
      }
      canLeave {
        ...FullPermissionCheckResult
      }
    }
  }
`)

export const projectPageLatestItemsModelsFragment = graphql(`
  fragment ProjectPageLatestItemsModels on Project {
    id
    role
    visibility
    workspace {
      id
      readOnly
    }
    modelCount: models(limit: 0) {
      totalCount
    }
    ...ProjectPageModelsStructureItem_Project
    ...ProjectCardImportFileArea_Project
    ...ProjectModelsAdd_Project
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
