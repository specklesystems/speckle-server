import { ObjectPreview } from '@/modules/previews/domain/types'
import { Nullable, Optional } from '@speckle/shared'

export type GetObjectPreviewInfo = (params: {
  streamId: string
  objectId: string
}) => Promise<Optional<ObjectPreview>>

export type CreateObjectPreview = (
  params: Pick<ObjectPreview, 'streamId' | 'objectId' | 'priority'>
) => Promise<void>

export type GetPreviewImage = (params: {
  previewId: string
}) => Promise<Nullable<Buffer>>

export type GetObjectPreviewBufferOrFilepath = (params: {
  streamId: string
  objectId: string
  angle: number
}) => Promise<
  | {
      type: 'file'
      file: string
      error?: true
      errorCode?: string
    }
  | { type: 'buffer'; buffer: Buffer }
>
