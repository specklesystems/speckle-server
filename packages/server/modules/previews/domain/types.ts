import { Nullable } from '@speckle/shared'

export type ObjectPreview = {
  streamId: string
  objectId: string
  previewStatus: number
  priority: number
  lastUpdate: Date
  preview: Nullable<Record<string, string>>
}

export type Preview = {
  id: string
  data: Buffer
}
