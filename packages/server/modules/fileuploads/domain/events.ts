import { FileUploadRecordV2 } from '@/modules/fileuploads/helpers/types'

export const fileuploadEventNamespace = 'fileupload' as const

const eventPrefix = `${fileuploadEventNamespace}.` as const

export const FileuploadEvents = {
  Started: `${eventPrefix}started`
} as const

export type FileuploadEvents = (typeof FileuploadEvents)[keyof typeof FileuploadEvents]

type FileuploadStartedPayload = Pick<
  FileUploadRecordV2,
  'userId' | 'projectId' | 'fileSize' | 'fileType'
>

export type FileuploadEventsPayloads = {
  [FileuploadEvents.Started]: FileuploadStartedPayload
}
