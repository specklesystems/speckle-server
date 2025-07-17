import { ScheduleFileimportJob } from '@/modules/fileuploads/domain/operations'
import { QueueMetrics } from '@/modules/fileuploads/observability/metrics'

export type FileImportQueue = {
  label: string
  supportedFileTypes: string[]
  shutdown: () => Promise<void>
  scheduleJob: ScheduleFileimportJob
  metrics: QueueMetrics
}
