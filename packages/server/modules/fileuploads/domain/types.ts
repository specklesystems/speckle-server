import { ScheduleFileimportJob } from '@/modules/fileuploads/domain/operations'

export type FileImportQueue = {
  label: string
  supportedFileTypes: string[]
  shutdown: () => Promise<void>
  scheduleJob: ScheduleFileimportJob
}
