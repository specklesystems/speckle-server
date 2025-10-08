import type {
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import type { FileImportResultPayload } from '@speckle/shared/workers/fileimport'

export const fileuploadEventNamespace = 'fileupload' as const

const eventPrefix = `${fileuploadEventNamespace}.` as const

export const FileuploadEvents = {
  Started: `${eventPrefix}started`,
  Updated: `${eventPrefix}updated`,
  Finished: `${eventPrefix}finished`
} as const

export type FileuploadEvents = (typeof FileuploadEvents)[keyof typeof FileuploadEvents]

type FileuploadStartedPayload = { upload: FileUploadRecordV2 & FileUploadRecord }
type FileuploadUpdatedPayload = {
  upload: FileUploadRecordV2
  /**
   * Whether the upload represents a new model being created. This is only supported in
   * legacy file uploads, where the model is created as part of the upload process.
   */
  isNewModel: boolean
}

type FileuploadFinishedPayload = {
  jobId: string
  jobResult: FileImportResultPayload
}

export type FileuploadEventsPayloads = {
  [FileuploadEvents.Started]: FileuploadStartedPayload
  [FileuploadEvents.Updated]: FileuploadUpdatedPayload
  [FileuploadEvents.Finished]: FileuploadFinishedPayload
}
