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
  mutation MarkCommentViewed($input: MarkCommentViewedInput!) {
    commentMutations {
      markViewed(input: $input)
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
  mutation ArchiveComment($input: ArchiveCommentInput!) {
    commentMutations {
      archive(input: $input)
    }
  }
`)
