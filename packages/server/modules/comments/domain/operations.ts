import {
  ExtendedComment,
  ResourceIdentifier,
  ViewerResourceGroup,
  ViewerResourceItem
} from '@/modules/comments/domain/types'
import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import {
  CreateCommentInput,
  ViewerUpdateTrackingTarget
} from '@/modules/core/graph/generated/graphql'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { MarkNullableOptional, Optional } from '@/modules/shared/helpers/typeHelper'
import { LegacyCommentViewerData } from '@/test/graphql/generated/graphql'
import { SpeckleViewer } from '@speckle/shared'
import { Knex } from 'knex'
import { Merge } from 'type-fest'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

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

export type GetCommentsResources = (commentIds: string[]) => Promise<{
  [commentId: string]: {
    commentId: string
    resources: ResourceIdentifier[]
  }
}>

export type CheckStreamResourcesAccess = (params: {
  streamId: string
  resources: ResourceIdentifier[]
}) => Promise<void>

export type ValidateInputAttachments = (
  streamId: string,
  blobIds: string[]
) => Promise<void>

export type GetViewerResourcesForComments = (
  projectId: string,
  commentIds: string[]
) => Promise<ViewerResourceItem[]>

export type GetViewerResourcesForComment = (
  projectId: string,
  commentId: string
) => Promise<ViewerResourceItem[]>

export type GetViewerResourcesFromLegacyIdentifiers = (
  projectId: string,
  resources: Array<ResourceIdentifier>
) => Promise<ViewerResourceItem[]>

export type GetViewerResourceGroups = (
  target: ViewerUpdateTrackingTarget
) => Promise<ViewerResourceGroup[]>

export type GetViewerResourceItemsUngrouped = (
  target: ViewerUpdateTrackingTarget
) => Promise<ViewerResourceItem[]>

export type ConvertLegacyDataToState = (
  data: Partial<LegacyCommentViewerData>,
  comment: CommentRecord
) => Promise<SerializedViewerState>

export type CreateCommentThreadAndNotify = (
  input: CreateCommentInput,
  userId: string
) => Promise<CommentRecord>
