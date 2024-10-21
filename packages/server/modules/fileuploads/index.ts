/* istanbul ignore file */
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import request from 'request'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { moduleLogger } from '@/logging/logging'
import { listenForImportUpdatesFactory } from '@/modules/fileuploads/services/resultListener'
import {
  getFileInfoFactory,
  saveUploadFileFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { getAutomationProjectFactory } from '@/modules/automate/repositories/automations'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getPort } from '@/modules/shared/helpers/envHelper'

const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  saveUploadFile: saveUploadFileFactory({ db }),
  publish
})
const getStream = getStreamFactory({ db })

const saveFileUploads = async ({
  userId,
  streamId,
  branchName,
  uploadResults
}: {
  userId: string
  streamId: string
  branchName: string
  uploadResults: Array<{
    blobId: string
    fileName: string
    fileSize: number
  }>
}) => {
  await Promise.all(
    uploadResults.map(async (upload) => {
      await insertNewUploadAndNotify({
        fileId: upload.blobId,
        streamId,
        branchName,
        userId,
        fileName: upload.fileName,
        fileType: upload.fileName.split('.').pop()!,
        fileSize: upload.fileSize
      })
    })
  )
}

export const init: SpeckleModule['init'] = async (app, isInitial) => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  } else {
    moduleLogger.info('📄 Init FileUploads module')
  }

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getRoles: getRolesFactory({ db }),
        getStream,
        getAutomationProject: getAutomationProjectFactory({ db })
      })
    ),
    async (req, res) => {
      const branchName = req.params.branchName || 'main'
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName
      })
      req.pipe(
        //TODO refactor packages/server/modules/blobstorage/index.js to use the service pattern, and then refactor this to call the service directly from here without the http overhead
        request(
          // we call this same server on localhost (IPv4) to upload the blob and do not make an external call
          `http://127.0.0.1:${getPort()}/api/stream/${req.params.streamId}/blob`,
          async (err, response, body) => {
            if (err) {
              res.log.error(err, 'Error while uploading blob.')
              res.status(500).send(err.message)
              return
            }
            if (response.statusCode === 201) {
              const { uploadResults } = JSON.parse(body)
              await saveFileUploads({
                userId: req.context.userId!,
                streamId: req.params.streamId,
                branchName,
                uploadResults
              })
            } else {
              res.log.error(
                {
                  statusCode: response.statusCode,
                  path: `http://127.0.0.1:${getPort()}/api/stream/${
                    req.params.streamId
                  }/blob`
                },
                'Error while uploading file.'
              )
            }
            res.status(response.statusCode).send(body)
          }
        )
      )
    }
  )

  if (isInitial) {
    const listenForImportUpdates = listenForImportUpdatesFactory({
      getFileInfo: getFileInfoFactory({ db }),
      publish,
      getStreamBranchByName: getStreamBranchByNameFactory({ db })
    })

    listenForImportUpdates()
  }
}
