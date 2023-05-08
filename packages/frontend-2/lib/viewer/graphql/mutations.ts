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

export const markCommentViewedMutation = graphql(`
  mutation MarkCommentViewed($threadId: String!) {
    commentMutations {
      markViewed(commentId: $threadId)
    }
  }
`)

export const createCommentThreadMutation = graphql(`
  mutation CreateCommentThread($input: CreateCommentInput!) {
    commentMutations {
      create(input: $input) {
        ...ViewerCommentThread
      }
    }
  }
`)

export const createCommentReplyMutation = graphql(`
  mutation CreateCommentReply($input: CreateCommentReplyInput!) {
    commentMutations {
      reply(input: $input) {
        ...ViewerCommentsReplyItem
      }
    }
  }
`)

export const archiveCommentMutation = graphql(`
  mutation ArchiveComment($commentId: String!, $archived: Boolean) {
    commentMutations {
      archive(commentId: $commentId, archived: $archived)
    }
  }
`)
