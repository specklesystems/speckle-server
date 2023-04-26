import { graphql } from '~~/lib/common/generated/gql'

export const onViewerUserActivityBroadcastedSubscription = graphql(`
  subscription OnViewerUserActivityBroadcasted($target: ViewerUpdateTrackingTarget!) {
    viewerUserActivityBroadcasted(target: $target) {
      userName
      userId
      user {
        ...LimitedUserAvatar
      }
      state
      status
      sessionId
    }
  }
`)

export const onViewerCommentsUpdatedSubscription = graphql(`
  subscription OnViewerCommentsUpdated($target: ViewerUpdateTrackingTarget!) {
    projectCommentsUpdated(target: $target) {
      id
      type
      comment {
        id
        parent {
          id
        }
        ...ViewerCommentThread
      }
    }
  }
`)
