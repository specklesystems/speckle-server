import Bull from 'bull'
import { logger } from "@/logging/logging";
import { isProdEnv, isTestEnv } from "@/modules/shared/helpers/envHelper";
import cryptoRandomString from "crypto-random-string";
import { Optional } from '@speckle/shared';
import { buildBaseQueueOptions } from '@/modules/shared/helpers/bullHelper';
import { UninitializedResourceAccessError } from '@/modules/shared/errors';

const MULTIREGION_QUEUE_NAME = isTestEnv()
  ? `test:multiregion:${cryptoRandomString({ length: 5 })}`
  : 'default:multiregion'

if (isTestEnv()) {
  logger.info(`Multiregion test queue ID: ${MULTIREGION_QUEUE_NAME}`)
  logger.info(`Monitor using: 'yarn cli bull monitor ${MULTIREGION_QUEUE_NAME}'`)
}

type MultiregionJob =
  | {
    type: 'move-project'
    payload: {
      projectId: string
      regionKey: string
    }
  }


let queue: Optional<Bull.Queue>

export const buildMultiregionQueue = (queueName: string) =>
  new Bull(queueName, {
    ...buildBaseQueueOptions(),
    ...(!isTestEnv()
      ? {
        limiter: {
          max: 10,
          duration: 1000
        }
      }
      : {}),
    defaultJobOptions: {
      attempts: 5,
      timeout: 1000 * 60 * 15, // 15 minute timeout
      backoff: {
        type: 'fixed',
        delay: 1000 * 60 * 5
      },
      removeOnComplete: isProdEnv(),
      removeOnFail: isProdEnv()
    }
  })

export const getQueue = (): Bull.Queue => {
  if (!queue) {
    throw new UninitializedResourceAccessError('Attempting to use uninitialized Bull queue')
  }

  return queue
}

export const initializeQueue = () => {
  queue = buildMultiregionQueue(MULTIREGION_QUEUE_NAME)
}

export const scheduleJob = async(message)
