import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'

export type ResourceIdentifier = {
  resourceId: string
  resourceType: ResourceType
}

export const ResourceType = {
  Comment: 'comment',
  Commit: 'commit',
  Object: 'object',
  Stream: 'stream'
} as const

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]

export type ExtendedComment = CommentRecord & {
  /**
   * comment_links resources for the comment
   */
  resources: Array<Omit<CommentLinkRecord, 'commentId'>>

  /**
   * If userId was specified, this will contain the last time the user
   * viewed this comment
   */
  viewedAt?: Date
}
