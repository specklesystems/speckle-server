import type { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import type { Nullable } from '@speckle/shared'

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

export type ViewerResourceItem = {
  /** Null if resource represents an object */
  modelId?: Nullable<string>
  objectId: string
  /** Null if resource represents an object */
  versionId?: Nullable<string>
}

export type ViewerResourceGroup = {
  /** Resource identifier used to refer to a collection of resource items */
  identifier: string
  /** Viewer resources that the identifier refers to */
  items: Array<ViewerResourceItem>
}
