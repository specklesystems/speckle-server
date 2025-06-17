import { JobPayload } from '@speckle/shared/workers/fileimport'

export type FileImportQueue = {
  label: string
  supportedFileTypes: string[]
  shutdown: () => Promise<void>
  scheduleJob: (jobData: JobPayload) => Promise<void>
}
