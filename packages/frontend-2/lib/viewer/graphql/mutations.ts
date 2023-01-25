import { graphql } from '~~/lib/common/generated/gql'

export const broadcastViewerUserActivityMutation = graphql(`
  mutation BroadcastViewerUserActivity(
    $projectId: String!
    $resourceIdString: String!
    $message: ViewerUserActivityMessageInput!
  ) {
    broadcastViewerUserActivity(
      projectId: $projectId
      resourceIdString: $resourceIdString
      message: $message
    )
  }
`)
