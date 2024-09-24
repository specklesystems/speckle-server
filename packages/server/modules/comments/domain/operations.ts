import { ExtendedComment, ResourceIdentifier } from '@/modules/comments/domain/types'
import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { MarkNullableOptional, Optional } from '@/modules/shared/helpers/typeHelper'
import { Knex } from 'knex'
import { Merge } from 'type-fest'

export type GetComment = (params: {
  id: string
  userId?: string
}) => Promise<Optional<ExtendedComment>>

export type CheckStreamResourceAccess = (
  res: ResourceIdentifier,
  streamId: string
) => Promise<void>

export type InsertCommentPayload = MarkNullableOptional<
  Omit<CommentRecord, 'id' | 'createdAt' | 'updatedAt' | 'text' | 'archived'> & {
    text: SmartTextEditorValueSchema
    archived?: boolean
    id?: string
  }
>

export type InsertComments = (
  comments: InsertCommentPayload[],
  options?: Partial<{ trx: Knex.Transaction }>
) => Promise<CommentRecord[]>

export type InsertCommentLinks = (
  commentLinks: CommentLinkRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) => Promise<CommentLinkRecord[]>

export type DeleteComment = (params: { commentId: string }) => Promise<boolean>

export type MarkCommentViewed = (commentId: string, userId: string) => Promise<boolean>

export type UpdateComment = (
  id: string,
  input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
) => Promise<Optional<CommentRecord>>

export type MarkCommentUpdated = (commentId: string) => Promise<void>

export type CheckStreamResourcesAccess = (params: {
  streamId: string
  resources: ResourceIdentifier[]
}) => Promise<void>

export type ValidateInputAttachments = (
  streamId: string,
  blobIds: string[]
) => Promise<void>
