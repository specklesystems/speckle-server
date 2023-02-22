import { CommentDataInput } from '@/modules/core/graph/generated/graphql'
import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type CommentLinkResourceType = 'stream' | 'commit' | 'object' | 'comment'

export interface CommentRecord {
  id: string
  streamId: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  text: Nullable<string>
  screenshot: Nullable<string>
  data: Nullable<CommentDataInput>
  archived: boolean
  parentComment: Nullable<string>
}

export interface CommentLinkRecord {
  commentId: string
  resourceId: string
  resourceType: CommentLinkResourceType
}

export interface CommentViewRecord {
  commentId: string
  userId: string
  viewedAt: Date
}
