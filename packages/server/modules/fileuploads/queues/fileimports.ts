import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import {
  getFileUploadTimeLimitMinutes,
  getRedisUrl,
  isProdEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'
import { Optional, TIME_MS } from '@speckle/shared'
import Bull from 'bull'
import cryptoRandomString from 'crypto-random-string'
import { initializeQueue as setupQueue } from '@speckle/shared/dist/commonjs/queue/index.js'
import { JobPayload } from '@speckle/shared/workers/fileimport'
import { ScheduleFileimportJob } from '@/modules/fileuploads/domain/operations'

const FILE_IMPORT_SERVICE_QUEUE_NAME = isTestEnv()
  ? `test:fileimport-service-jobs:${cryptoRandomString({ length: 5 })}`
  : 'fileimport-service-jobs'

let queue: Optional<Bull.Queue<JobPayload>>

if (isTestEnv()) {
  logger.info(`Fileimport service test queue ID: ${FILE_IMPORT_SERVICE_QUEUE_NAME}`)
  logger.info(
    `Monitor using: 'yarn cli bull monitor ${FILE_IMPORT_SERVICE_QUEUE_NAME}'`
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

export const initializeQueue = async () => {
  queue = await setupQueue({
    queueName: FILE_IMPORT_SERVICE_QUEUE_NAME,
    redisUrl: getRedisUrl(),
    options: {
      ...(!isTestEnv() ? { limiter } : {}),
      defaultJobOptions
    }
  })
}

export const shutdownQueue = async () => {
  if (!queue) return
  await queue.close()
}

export const scheduleJob: ScheduleFileimportJob = async (jobData) => {
  if (!queue) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized Bull queue'
    )
  }

  await queue.add(jobData, { removeOnComplete: true, attempts: 3 })
}
