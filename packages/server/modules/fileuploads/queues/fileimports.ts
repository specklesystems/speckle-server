import {
  getFileImportServiceIFCParserRedisUrl,
  getFileImportServiceIFCQueueName,
  getFileImportServiceRhinoParserRedisUrl,
  getFileImportServiceRhinoQueueName,
  getFileImportTimeLimitMinutes,
  getRedisUrl,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { Logger, fileUploadsLogger as logger } from '@/observability/logging'
import { TIME, TIME_MS } from '@speckle/shared'
import { initializeQueue as setupQueue } from '@speckle/shared/dist/commonjs/queue/index.js'
import { JobPayload } from '@speckle/shared/workers/fileimport'
import { FileImportQueue } from '@/modules/fileuploads/domain/types'
import Bull, {
  ActiveEventCallback,
  ErrorEventCallback,
  FailedEventCallback
} from 'bull'
import {
  NumberOfFileImportRetries,
  DelayBetweenFileImportRetriesMinutes
} from '@/modules/fileuploads/domain/consts'

const FILEIMPORT_SERVICE_RHINO_QUEUE_NAME = getFileImportServiceRhinoQueueName()
const FILEIMPORT_SERVICE_IFC_QUEUE_NAME = getFileImportServiceIFCQueueName()

export const fileImportQueues: FileImportQueue[] = []

if (isTestEnv()) {
  logger.info(`Fileimport service test queue ID: ${FILEIMPORT_SERVICE_IFC_QUEUE_NAME}`)
  logger.info(
    `Monitor using: 'yarn cli bull monitor ${FILEIMPORT_SERVICE_IFC_QUEUE_NAME}'`
  )
}

const limiter = {
  max: 10,
  duration: TIME_MS.second
}

const defaultJobOptions = {
  attempts: NumberOfFileImportRetries,
  timeout:
    NumberOfFileImportRetries *
    (getFileImportTimeLimitMinutes() + DelayBetweenFileImportRetriesMinutes) *
    TIME_MS.minute,
  backoff: {
    type: 'fixed',
    delay: DelayBetweenFileImportRetriesMinutes * TIME_MS.minute
  },
  removeOnComplete: {
    // retain completed jobs for 1 day or until it is the 100th completed job being retained, whichever comes first
    age: 1 * TIME.day,
    count: 100
  },
  removeOnFail: {
    // retain completed jobs for 1 week or until it is the 1_000th failed job being retained, whichever comes first
    age: 1 * TIME.week,
    count: 1_000
  }
}

export const initializeQueueFactory =
  (deps: {
    jobActiveHandler: ActiveEventCallback
    jobErrorHandler: ErrorEventCallback
    jobFailedHandler: FailedEventCallback
  }) =>
  async (params: {
    label: string
    queueName: string
    redisUrl: string
    supportedFileTypes: string[]
  }): Promise<FileImportQueue & { queue: Bull.Queue }> => {
    const { label, queueName, redisUrl, supportedFileTypes } = params
    const queue = await setupQueue({
      queueName,
      redisUrl,
      options: {
        ...(!isTestEnv() ? { limiter } : {}),
        defaultJobOptions
      }
    })

    queue.removeListener('active', deps.jobActiveHandler)
    queue.on('active', deps.jobActiveHandler)

    // The error event is triggered when an error in the Redis backend is thrown.
    queue.removeListener('error', deps.jobErrorHandler)
    queue.on('error', deps.jobErrorHandler)

    // The failed event is triggered when a job fails by throwing an exception during execution.
    // https://api.docs.bullmq.io/interfaces/v5.QueueEventsListener.html#failed
    queue.removeListener('failed', deps.jobFailedHandler)
    queue.on('failed', deps.jobFailedHandler)

    const fileImportQueue = {
      label,
      queue,
      supportedFileTypes: supportedFileTypes.map(
        (type) => type.toLocaleLowerCase() // Normalize file types to lowercase (this is a safeguard to prevent stupid typos in the future)
      ),
      shutdown: async () => await queue.close(),
      scheduleJob: async (jobData: JobPayload): Promise<void> => {
        await queue.add(jobData, defaultJobOptions)
      }
    }
    fileImportQueues.push(fileImportQueue)
    return fileImportQueue
  }

export const initializeRhinoQueueFactory =
  (deps: { initializeQueue: ReturnType<typeof initializeQueueFactory> }) => async () =>
    deps.initializeQueue({
      label: 'rhino',
      queueName: FILEIMPORT_SERVICE_RHINO_QUEUE_NAME,
      redisUrl: getFileImportServiceRhinoParserRedisUrl() ?? getRedisUrl(),
      supportedFileTypes: ['obj', 'stl', 'skp']
    })

export const initializeIfcQueueFactory =
  (deps: { initializeQueue: ReturnType<typeof initializeQueueFactory> }) => async () =>
    deps.initializeQueue({
      label: 'ifc',
      queueName: FILEIMPORT_SERVICE_IFC_QUEUE_NAME,
      redisUrl: getFileImportServiceIFCParserRedisUrl() ?? getRedisUrl(),
      supportedFileTypes: ['ifc']
    })

export const shutdownQueues = async (params: { logger: Logger }) => {
  for (const queue of fileImportQueues) {
    await queue.shutdown()
    params.logger.info(`📄 FileUploads, shutdown queue for ${queue.label} parser`)
  }
}
