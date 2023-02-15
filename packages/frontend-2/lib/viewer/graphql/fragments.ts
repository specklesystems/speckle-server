import { graphql } from '~~/lib/common/generated/gql'

export const viewerCommentThreadFragment = graphql(`
  fragment ViewerCommentThread on Comment {
    ...ViewerCommentsListItem
    ...ViewerCommentBubblesData
  }
`)
