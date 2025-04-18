import type { ObjectPreview } from '@/modules/previews/domain/types'
import type {
  MaybeNullOrUndefined,
  Nullable,
  Optional,
  PartialBy
} from '@speckle/shared'
import type { Request, Response } from 'express'
import { PreviewStatus } from '@/modules/previews/domain/consts'

export type GetObjectPreviewInfo = (params: {
  streamId: string
  objectId: string
}) => Promise<Optional<ObjectPreview>>

export type GetPaginatedObjectPreviewsInErrorState = (params: {
  limit: number
  cursor?: MaybeNullOrUndefined<string>
}) => Promise<{
  totalCount: number
  items: ObjectPreview[]
  cursor: string | null
}>

export type PaginatedObjectPreviewsParams = {
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    status: (typeof PreviewStatus)[keyof typeof PreviewStatus]
  }>
}

export type GetPaginatedObjectPreviewsPage = (
  params: PaginatedObjectPreviewsParams
) => Promise<{
  items: ObjectPreview[]
  cursor: string | null
}>

export type GetPaginatedObjectPreviewsTotalCount = (
  params: Omit<PaginatedObjectPreviewsParams, 'limit' | 'cursor'>
) => Promise<number>

export type CreateObjectPreview = (
  params: Pick<ObjectPreview, 'streamId' | 'objectId' | 'priority'>
) => Promise<boolean>

export type ObjectPreviewInput = Pick<
  ObjectPreview,
  'streamId' | 'objectId' | 'priority'
>
export type StoreObjectPreview = (params: ObjectPreviewInput) => Promise<void>
export type UpsertObjectPreview = (params: {
  objectPreview: PartialBy<ObjectPreview, 'preview' | 'priority'>
}) => Promise<void>

export type ObjectPreviewRequest = {
  url: string
  token: string
  jobId: string
}

export type Preview = {
  id: string
  data: Buffer
}

export type StorePreview = (params: { preview: Preview }) => Promise<void>

export type RequestObjectPreview = (params: ObjectPreviewRequest) => Promise<void>

export type GetPreviewImage = (params: {
  previewId: string
}) => Promise<Nullable<Buffer>>

export type GetObjectPreviewBufferOrFilepath = (params: {
  streamId: string
  objectId: string
  angle?: string
}) => Promise<
  | {
      type: 'file'
      file: string
      error?: true
      errorCode?: string
    }
  | { type: 'buffer'; buffer: Buffer; error?: true; errorCode?: string }
>

export type SendObjectPreview = (
  req: Request,
  res: Response,
  streamId: string,
  objectId: string,
  angle?: string
) => Promise<void>

export type CheckStreamPermissions = (
  req: Request
) => Promise<{ hasPermissions: boolean; httpErrorCode: number }>
