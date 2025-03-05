import crs from 'crypto-random-string'
import {
  upsertBlobFactory,
  updateBlobFactory,
  getBlobMetadataFactory
} from '@/modules/blobstorage/repositories'
import {
  uploadFileStreamFactory,
  markUploadSuccessFactory,
  markUploadErrorFactory,
  markUploadOverFileSizeLimitFactory
} from '@/modules/blobstorage/services/management'
import {
  deleteObjectFactory,
  getObjectAttributesFactory,
  storeFileStreamFactory
} from '@/modules/blobstorage/repositories/blobs'
import { ensureError, Nullable } from '@speckle/shared'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type { Logger } from '@/observability/logging'
import type { Writable } from 'stream'
import { get } from 'lodash'
import { UploadResult } from '@/modules/blobstorage/domain/types'
import { ProcessingResult } from '@/modules/blobstorage/domain/types'

type NewFileStreamProcessor = (params: {
  writeable: Writable
  streamId: string
  userId: string
  onFinishAllFileUploads: (results: Array<UploadResult>) => Promise<void>
  onError: (err: unknown) => void
  logger: Logger
}) => Promise<Writable>

export const processNewFileStreamFactory = (): NewFileStreamProcessor => {
  return async (params) => {
    const { writeable, streamId, userId, onFinishAllFileUploads, onError } = params
    let { logger } = params
    const uploadOperations: Record<string, unknown> = {}
    const finalizePromises: Promise<{
      uploadStatus?: number
      uploadError?: Error | null | string
      formKey: string
      blobId: string
      fileName: string
      fileSize: Nullable<number>
    }>[] = []

    const [projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId: streamId }),
      getProjectObjectStorage({ projectId: streamId })
    ])

    const storeFileStream = storeFileStreamFactory({ storage: projectStorage })
    const updateBlob = updateBlobFactory({ db: projectDb })
    const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })

    const uploadFileStream = uploadFileStreamFactory({
      storeFileStream,
      upsertBlob: upsertBlobFactory({ db: projectDb }),
      updateBlob
    })

    const markUploadSuccess = markUploadSuccessFactory({
      getBlobMetadata,
      updateBlob
    })
    const markUploadError = markUploadErrorFactory({ getBlobMetadata, updateBlob })
    const markUploadOverFileSizeLimit = markUploadOverFileSizeLimitFactory({
      getBlobMetadata,
      updateBlob
    })

    const getObjectAttributes = getObjectAttributesFactory({
      storage: projectStorage
    })
    const deleteObject = deleteObjectFactory({ storage: projectStorage })

    writeable.on('file', (formKey, file, info) => {
      const { filename: fileName } = info
      const fileType = fileName?.split('.')?.pop()?.toLowerCase()
      logger = logger.child({ fileName, fileType })
      const registerUploadResult = (processingPromise: Promise<ProcessingResult>) => {
        finalizePromises.push(
          processingPromise.then((resultItem) => ({ ...resultItem, formKey }))
        )
      }

      let blobId = crs({ length: 10 })
      let clientHash = null
      if (formKey.includes('hash:')) {
        clientHash = formKey.split(':')[1]
        if (clientHash && clientHash !== '') {
          // logger.debug(`I have a client hash (${clientHash})`)
          blobId = clientHash
        }
      }

      logger = logger.child({ blobId })

      uploadOperations[blobId] = uploadFileStream(
        { streamId, userId },
        { blobId, fileName, fileType, fileStream: file }
      )

      //this file level 'close' is fired when a single file upload finishes
      //this way individual upload statuses can be updated, when done
      file.on('close', async () => {
        //this is handled by the file.on('limit', ...) event
        if (file.truncated) return
        await uploadOperations[blobId]

        registerUploadResult(markUploadSuccess(getObjectAttributes, streamId, blobId))
      })

      file.on('limit', async () => {
        await uploadOperations[blobId]
        registerUploadResult(
          markUploadOverFileSizeLimit(deleteObject, streamId, blobId)
        )
      })

      file.on('error', (err: unknown) => {
        registerUploadResult(
          markUploadError(deleteObject, streamId, blobId, get(err, 'message'))
        )
      })
    })

    writeable.on('finish', async () => {
      // make sure all upload operations have been awaited,
      // otherwise the finish even can fire before all async operations finish
      //resulting in missing return values
      await Promise.all(Object.values(uploadOperations))
      // have to make sure all finalize promises have been awaited
      const uploadResults = await Promise.all(finalizePromises)
      await onFinishAllFileUploads(uploadResults)
      return
    })

    writeable.on('error', async (err) => {
      logger.info({ err }, 'Upload request error.')
      //delete all started uploads
      await Promise.all(
        Object.keys(uploadOperations).map((blobId) =>
          markUploadError(
            deleteObject,
            streamId,
            blobId,
            ensureError(err, 'Unknown error while uploading blob').message
          )
        )
      )

      onError(err)
      return
    })

    return writeable
  }
}
