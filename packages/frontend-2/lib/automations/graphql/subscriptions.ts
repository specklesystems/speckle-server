import { graphql } from '~~/lib/common/generated/gql'

export const onModelVersionCardAutomationsStatusUpdated = graphql(`
  subscription OnModelVersionCardAutomationsStatusUpdated($projectId: String!) {
    projectAutomationsStatusUpdated(projectId: $projectId) {
      status {
        ...ModelCardAutomationStatus_AutomationsStatus
      }
      version {
        id
      }
      model {
        id
        versions(limit: 1) {
          items {
            id
          }
        }
      }
    }
  }
`)
