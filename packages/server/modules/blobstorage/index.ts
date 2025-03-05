import { moduleLogger } from '@/observability/logging'
import {
  createS3Bucket,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { ensureStorageAccessFactory } from '@/modules/blobstorage/repositories/blobs'
import { getMainObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import { blobStorageRouterFactory } from '@/modules/blobstorage/rest/router'

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

export const init: SpeckleModule['init'] = async (app) => {
  await ensureConditions()

  app.use(blobStorageRouterFactory())
}

export const finalize: SpeckleModule['finalize'] = () => {}
