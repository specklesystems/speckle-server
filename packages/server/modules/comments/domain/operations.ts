import { ResourceIdentifier } from '@/modules/comments/domain/types'
import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { MarkNullableOptional } from '@/modules/shared/helpers/typeHelper'
import { Knex } from 'knex'

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

export type CheckStreamResourcesAccess = (params: {
  streamId: string
  resources: ResourceIdentifier[]
}) => Promise<void>

export type ValidateInputAttachments = (
  streamId: string,
  blobIds: string[]
) => Promise<void>
