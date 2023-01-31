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
    data {
      location
      camPos
      sectionBox
      selection
      filters {
        hiddenIds
        isolatedIds
        propertyInfoKey
        passMax
        passMin
        sectionBox
      }
    }
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
