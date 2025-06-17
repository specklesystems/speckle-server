import {
  getFileImportServiceIFCParserRedisUrl,
  getFileImportServiceIFCQueueName,
  getFileImportServiceRhinoParserRedisUrl,
  getFileImportServiceRhinoQueueName,
  getFileUploadTimeLimitMinutes,
  getRedisUrl,
  isProdEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'
import { TIME_MS } from '@speckle/shared'
import { initializeQueue as setupQueue } from '@speckle/shared/dist/commonjs/queue/index.js'
import { JobPayload } from '@speckle/shared/workers/fileimport'

const FILEIMPORT_SERVICE_RHINO_QUEUE_NAME = getFileImportServiceRhinoQueueName()
const FILEIMPORT_SERVICE_IFC_QUEUE_NAME = getFileImportServiceIFCQueueName()

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
  attempts: 5,
  timeout: getFileUploadTimeLimitMinutes() * TIME_MS.minute,
  backoff: {
    type: 'fixed',
    delay: 5 * TIME_MS.minute
  },
  removeOnComplete: isProdEnv(),
  removeOnFail: false
}

const initializeQueue = async (params: {
  label: string
  queueName: string
  redisUrl: string
  supportedFileTypes: string[]
}) => {
  const { label, queueName, redisUrl, supportedFileTypes } = params
  const queue = await setupQueue({
    queueName,
    redisUrl,
    options: {
      ...(!isTestEnv() ? { limiter } : {}),
      defaultJobOptions
    }
  })
  return {
    label,
    queue,
    supportedFileTypes: supportedFileTypes.map(
      (type) => type.toLocaleLowerCase() // Normalize file types to lowercase (this is a safeguard to prevent stupid typos in the future)
    ),
    shutdown: async () => await queue.close(),
    scheduleJob: async (jobData: JobPayload): Promise<void> => {
      await queue.add(jobData, { removeOnComplete: true, attempts: 3 })
    }
  }
}

export const initializeRhinoQueue = async () =>
  initializeQueue({
    label: 'Rhino File Import Queue',
    queueName: FILEIMPORT_SERVICE_RHINO_QUEUE_NAME,
    redisUrl: getFileImportServiceRhinoParserRedisUrl() ?? getRedisUrl(),
    supportedFileTypes: ['obj']
  })

export const initalizeIfcQueue = async () =>
  initializeQueue({
    label: 'IFC File Import Queue',
    queueName: FILEIMPORT_SERVICE_IFC_QUEUE_NAME,
    redisUrl: getFileImportServiceIFCParserRedisUrl() ?? getRedisUrl(),
    supportedFileTypes: ['ifc']
  })
