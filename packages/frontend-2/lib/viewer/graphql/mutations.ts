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

export const markCommentViewed = graphql(`
  mutation MarkCommentViewed($projectId: String!, $threadId: String!) {
    commentView(streamId: $projectId, commentId: $threadId)
  }
`)
