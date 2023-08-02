import { graphql } from '~~/lib/common/generated/gql'

export const viewerCommentThreadFragment = graphql(`
  fragment ViewerCommentThread on Comment {
    ...ViewerCommentsListItem
    ...ViewerCommentBubblesData
    ...ViewerCommentsReplyItem
  }
`)

export const viewerReplyFragment = graphql(`
  fragment ViewerCommentsReplyItem on Comment {
    id
    archived
    rawText
    text {
      doc
    }
    author {
      ...LimitedUserAvatar
    }
    createdAt
    ...ThreadCommentAttachment
  }
`)
