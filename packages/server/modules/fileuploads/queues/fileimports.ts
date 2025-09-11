import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { Logger } from '@/observability/logging'
import type { JobPayloadV1 } from '@speckle/shared/workers/fileimport'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'
import {
  NumberOfFileImportRetries,
  BackgroundJobType,
  BackgroundJobPayloadVersion,
  singleAttemptMaximumProcessingTimeSeconds
} from '@/modules/fileuploads/domain/consts'
import type { Knex } from 'knex'
import { migrateDbToLatest } from '@/db/migrations'
import { createBackgroundJobFactory } from '@/modules/backgroundjobs/services/create'
import {
  getBackgroundJobCountFactory,
  storeBackgroundJobFactory
} from '@/modules/backgroundjobs/repositories/backgroundjobs'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain/types'
import type { FindQueue } from '@/modules/fileuploads/domain/operations'

const fileImportQueues: FileImportQueue[] = []

export const findQueue: FindQueue = (filter) => {
  return fileImportQueues.find((q) =>
    q.supportedFileTypes.includes(filter.fileType.toLocaleLowerCase())
  )
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

  const createBackgroundJob = createBackgroundJobFactory({
    jobConfig: {
      maxAttempt: NumberOfFileImportRetries,
      remainingComputeBudgetSeconds: 2 * singleAttemptMaximumProcessingTimeSeconds()
    },
    storeBackgroundJob: storeBackgroundJobFactory({
      db,
      originServerUrl: getServerOrigin()
    })
  })
  const getBackgroundJobCount = getBackgroundJobCountFactory({ db })

  const fileImportQueue = {
    label,
    supportedFileTypes: supportedFileTypes.map(
      (type) => type.toLocaleLowerCase() // Normalize file types to lowercase (this is a safeguard to prevent stupid typos in the future)
    ),
    shutdown: async () => {},
    scheduleJob: async (jobData: JobPayloadV1) => {
      await createBackgroundJob({
        jobPayload: {
          jobType: BackgroundJobType.FileImport,
          payloadVersion: BackgroundJobPayloadVersion.v1,
          ...jobData
        }
      })
    },
    metrics: {
      getPendingJobCount: () =>
        getBackgroundJobCount({
          status: BackgroundJobStatus.Queued,
          jobType: BackgroundJobType.FileImport
        }),
      getWaitingJobCount: () =>
        getBackgroundJobCount({
          status: BackgroundJobStatus.Queued,
          jobType: BackgroundJobType.FileImport,
          minAttempts: 1
        }),
      getActiveJobCount: () =>
        getBackgroundJobCount({
          status: BackgroundJobStatus.Processing,
          jobType: BackgroundJobType.FileImport
        })
    }
  }
  fileImportQueues.push(fileImportQueue)
  return fileImportQueue
}

export const shutdownQueues = async (params: { logger: Logger }) => {
  for (const queue of fileImportQueues) {
    await queue.shutdown()
    params.logger.info(`📄 FileUploads, shutdown queue for ${queue.label} parser`)
  }
}
