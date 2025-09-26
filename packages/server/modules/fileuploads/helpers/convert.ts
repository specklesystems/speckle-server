import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import type { FileImportResultPayload } from '@speckle/shared/workers/fileimport'
import { FileImportInvalidJobResultPayload } from '@/modules/fileuploads/errors'

export const jobResultStatusToFileUploadStatus = (
  jobResultStatus: 'success' | 'error'
) => {
  switch (jobResultStatus) {
    case 'success':
      return FileUploadConvertedStatus.Completed
    case 'error':
      return FileUploadConvertedStatus.Error
    default:
      throw new FileImportInvalidJobResultPayload(
        `Unknown job result status: ${jobResultStatus}`
      )
  }
}

export const jobResultToConvertedMessage = (jobResult: FileImportResultPayload) => {
  switch (jobResult.status) {
    case 'success':
      return jobResult.warnings.join('; ')
    case 'error':
      return jobResult.reason
    default:
      throw new FileImportInvalidJobResultPayload('Unknown job result status')
  }
}
