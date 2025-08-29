import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { Logger } from '@/observability/logging'
import type { JobPayload } from '@speckle/shared/workers/fileimport'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'
import {
  NumberOfFileImportRetries,
  BackgroundJobType,
  BackgroundJobPayloadVersion
} from '@/modules/fileuploads/domain/consts'
import type { Knex } from 'knex'
import { migrateDbToLatest } from '@/db/migrations'
import { createBackgroundJobFactory } from '@/modules/backgroundjobs/services/create'
import {
  getBackgroundJobCountFactory,
  storeBackgroundJobFactory
} from '@/modules/backgroundjobs/repositories'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain'
import { calculateTotalFileImportTimeoutMs } from '@/modules/fileuploads/services/createFileImport'

export const fileImportQueues: FileImportQueue[] = []

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
      timeoutMs: calculateTotalFileImportTimeoutMs()
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
    scheduleJob: async (jobData: JobPayload) => {
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
