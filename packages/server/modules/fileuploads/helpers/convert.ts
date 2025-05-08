import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'

export const jobResultStatusToFileUploadStatus = (
  jobResultStatus: 'success' | 'error'
) => {
  switch (jobResultStatus) {
    case 'success':
      return FileUploadConvertedStatus.Completed
    case 'error':
      return FileUploadConvertedStatus.Error
    default:
      throw new Error(`Unknown job result status: ${jobResultStatus}`)
  }
}
