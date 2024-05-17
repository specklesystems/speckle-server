import { graphql } from '~~/lib/common/generated/gql'

export const onProjectUpdatedSubscription = graphql(`
  subscription OnProjectUpdated($id: String!) {
    projectUpdated(id: $id) {
      id
      type
      project {
        ...ProjectPageProject
        ...ProjectDashboardItemNoModels
      }
    }
  }
`)

export const onProjectModelsUpdateSubscription = graphql(`
  subscription OnProjectModelsUpdate($id: String!) {
    projectModelsUpdated(id: $id) {
      id
      type
      model {
        id
        versions(limit: 1) {
          items {
            id
            referencedObject
          }
        }
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
        ...ViewerModelVersionCardItem
        ...ProjectModelPageVersionsCardVersion
        model {
          id
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const onProjectVersionsPreviewGeneratedSubscription = graphql(`
  subscription OnProjectVersionsPreviewGenerated($id: String!) {
    projectVersionsPreviewGenerated(id: $id) {
      projectId
      objectId
      versionId
    }
  }
`)

export const onProjectPendingModelsUpdatedSubscription = graphql(`
  subscription OnProjectPendingModelsUpdated($id: String!) {
    projectPendingModelsUpdated(id: $id) {
      id
      type
      model {
        ...PendingFileUpload
        model {
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const onProjectPendingVersionsUpdatedSubscription = graphql(`
  subscription OnProjectPendingVersionsUpdated($id: String!) {
    projectPendingVersionsUpdated(id: $id) {
      id
      type
      version {
        ...PendingFileUpload
        model {
          ...ProjectPageLatestItemsModelItem
        }
      }
    }
  }
`)

export const onProjectTriggeredAutomationsStatusUpdatedSubscription = graphql(`
  subscription OnProjectTriggeredAutomationsStatusUpdated($id: String!) {
    projectTriggeredAutomationsStatusUpdated(projectId: $id) {
      type
      version {
        id
        automationsStatus {
          automationRuns {
            ...AutomateViewerPanel_AutomateRun
          }
          ...TriggeredAutomationsStatusSummary
          ...AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus
        }
      }
      model {
        id
      }
      run {
        id
        automationId
        ...AutomationRunDetails
      }
    }
  }
`)

export const onProjectAutomationsUpdatedSubscription = graphql(`
  subscription OnProjectAutomationsUpdated($id: String!) {
    projectAutomationsUpdated(projectId: $id) {
      type
      automationId
      automation {
        id
        ...ProjectPageAutomationPage_Automation
        ...ProjectPageAutomationsRow_Automation
      }
    }
  }
`)
