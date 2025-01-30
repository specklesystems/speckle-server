import { Brand } from '@/utils/brand.js'

export type ObjectIdentifier = {
  streamId: string
  objectId: string
}

export type Preview = {
  previewId: string
  imgBuffer: Buffer
}

export type Angle = Brand<string, 'Angle'>
export type PreviewId = Brand<string, 'PreviewId'>
