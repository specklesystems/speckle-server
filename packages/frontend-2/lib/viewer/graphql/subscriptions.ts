import { graphql } from '~~/lib/common/generated/gql'

export const onViewerUserActivityBroadcastedSubscription = graphql(`
  subscription OnViewerUserActivityBroadcasted(
    $projectId: String!
    $resourceIdString: String!
  ) {
    viewerUserActivityBroadcasted(
      projectId: $projectId
      resourceIdString: $resourceIdString
    ) {
      userName
      userId
      viewerSessionId
      status
      typing {
        isTyping
        threadId
      }
      selection {
        filteringState
        selectionLocation
        sectionBox
        camera
      }
    }
  }
`)
