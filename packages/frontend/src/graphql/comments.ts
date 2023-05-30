import { gql } from '@apollo/client/core'

export const COMMENT_FULL_INFO_FRAGMENT = gql`
  fragment CommentFullInfo on Comment {
    id
    archived
    authorId
    text {
      doc
      attachments {
        id
        fileName
        streamId
        fileType
        fileSize
      }
    }
    data
    screenshot
    replies {
      totalCount
    }
    resources {
      resourceId
      resourceType
    }
    createdAt
    updatedAt
    viewedAt
  }
`
