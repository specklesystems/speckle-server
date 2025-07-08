import {
  getFileImportServiceIFCParserRedisUrl,
  getFileImportServiceIFCQueueName,
  getFileImportServiceRhinoParserRedisUrl,
  getFileImportServiceRhinoQueueName,
  getFileImportTimeLimitMinutes,
  getRedisUrl,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { Logger, logger } from '@/observability/logging'
import { TIME, TIME_MS } from '@speckle/shared'
import { initializeQueue as setupQueue } from '@speckle/shared/dist/commonjs/queue/index.js'
import { JobPayload } from '@speckle/shared/workers/fileimport'
import { FileImportQueue } from '@/modules/fileuploads/domain/types'
import Bull from 'bull'
import {
  NumberOfFileImportRetries,
  DelayBetweenFileImportRetriesMinutes
} from '@/modules/fileuploads/domain/consts'
import { Knex } from 'knex'
import { migrateDbToLatest } from '@/db/migrations'
import { scheduleBackgroundJobFactory } from '@/modules/backgroundjobs/services'
import { storeBackgroundJobFactory } from '@/modules/backgroundjobs/repositories'

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

const timeout =
  NumberOfFileImportRetries *
  (getFileImportTimeLimitMinutes() + DelayBetweenFileImportRetriesMinutes) *
  TIME_MS.minute

const defaultJobOptions = {
  attempts: NumberOfFileImportRetries,
  timeout,
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

const initializeQueue = async (params: {
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

export const initializePostgresQueue = async ({
  label,
  supportedFileTypes,
  db
}: {
  label: string
  db: Knex
  supportedFileTypes: string[]
}): Promise<FileImportQueue> => {
  // migrating the DB up, the queue DB might be added based on a config
  await migrateDbToLatest({ db, region: `Queue DB for ${label}` })

  const scheduleBackgroundJob = scheduleBackgroundJobFactory({
    jobConfig: { maxAttempt: 3, timeoutMs: timeout },
    storeBackgroundJob: storeBackgroundJobFactory({ db })
  })
  const fileImportQueue = {
    label,
    supportedFileTypes: supportedFileTypes.map(
      (type) => type.toLocaleLowerCase() // Normalize file types to lowercase (this is a safeguard to prevent stupid typos in the future)
    ),
    shutdown: async () => {},
    scheduleJob: async (jobData: JobPayload) => {
      await scheduleBackgroundJob({
        jobPayload: { jobType: 'fileImport', payloadVersion: 1, ...jobData }
      })
    }
  }
  fileImportQueues.push(fileImportQueue)
  return fileImportQueue
}

export const initializeRhinoQueue = async () => {
  const rhinoImportServiceRedisUrl = getFileImportServiceRhinoParserRedisUrl()

  return initializeQueue({
    label: 'rhino',
    queueName: FILEIMPORT_SERVICE_RHINO_QUEUE_NAME,
    redisUrl: rhinoImportServiceRedisUrl ? rhinoImportServiceRedisUrl : getRedisUrl(),
    supportedFileTypes: ['obj', 'stl', 'skp']
  })
}

export const initializeIfcQueue = async () => {
  const ifcImportServiceRedisUrl = getFileImportServiceIFCParserRedisUrl()

  return initializeQueue({
    label: 'ifc',
    queueName: FILEIMPORT_SERVICE_IFC_QUEUE_NAME,
    redisUrl: ifcImportServiceRedisUrl ? ifcImportServiceRedisUrl : getRedisUrl(),
    supportedFileTypes: ['ifc']
  })
}

export const shutdownQueues = async (params: { logger: Logger }) => {
  for (const queue of fileImportQueues) {
    await queue.shutdown()
    params.logger.info(`📄 FileUploads, shutdown queue for ${queue.label} parser`)
  }
}
