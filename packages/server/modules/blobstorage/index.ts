import type cron from 'node-cron'
import { db } from '@/db/knex'
import { moduleLogger } from '@/observability/logging'
import {
  createS3Bucket,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { ensureStorageAccessFactory } from '@/modules/blobstorage/repositories/blobs'
import { getMainObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import { blobStorageRouterFactory } from '@/modules/blobstorage/rest/router'
import { scheduleBlobPendingUploadExpiry } from '@/modules/blobstorage/tasks'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'

const ensureConditions = async () => {
  if (!isFileUploadsEnabled()) {
    moduleLogger.info('📦 Blob storage is DISABLED')
    return
  }

  moduleLogger.info('📦 Init BlobStorage module')
  const storage = getMainObjectStorage()
  const ensureStorageAccess = ensureStorageAccessFactory({ storage })
  await ensureStorageAccess({
    createBucketIfNotExists: createS3Bucket()
  })
}

const scheduledTasks: cron.ScheduledTask[] = []
export const init: SpeckleModule['init'] = async ({ app }) => {
  await ensureConditions()

  app.use(blobStorageRouterFactory())

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  scheduledTasks.push(await scheduleBlobPendingUploadExpiry({ scheduleExecution }))
}

export const finalize: SpeckleModule['finalize'] = () => {}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTasks.forEach((task) => task.stop())
}
