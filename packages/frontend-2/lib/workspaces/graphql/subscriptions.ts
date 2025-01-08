import { graphql } from '~/lib/common/generated/gql'

export const onWorkspaceUpdatedSubscription = graphql(`
  subscription onWorkspaceUpdated(
    $workspaceId: String
    $workspaceSlug: String
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
  ) {
    workspaceUpdated(workspaceId: $workspaceId, workspaceSlug: $workspaceSlug) {
      id
      workspace {
        id
        ...WorkspaceProjectList_Workspace
      }
    }
  }
`)
