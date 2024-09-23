import { DataStruct, LegacyData } from '@/modules/comments/services/data'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type CommentLinkResourceType = 'stream' | 'commit' | 'object' | 'comment'

export interface CommentRecord {
  id: string
  streamId: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  text: Nullable<string | SmartTextEditorValueSchema>
  screenshot: Nullable<string>
  data: Nullable<LegacyData | DataStruct>
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
