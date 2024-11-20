/* istanbul ignore file */
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import request from 'request'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { moduleLogger } from '@/logging/logging'
import {
  onFileImportProcessedFactory,
  onFileProcessingFactory,
  parseMessagePayload
} from '@/modules/fileuploads/services/resultListener'
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
import { addBranchCreatedActivityFactory } from '@/modules/activitystream/services/branchActivity'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { getPort } from '@/modules/shared/helpers/envHelper'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { listenFor } from '@/modules/core/utils/dbNotificationListener'

export const init: SpeckleModule['init'] = async (app, isInitial) => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  } else {
    moduleLogger.info('📄 Init FileUploads module')
  }

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    async (req, res, next) => {
      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      await authMiddlewareCreator(
        streamWritePermissionsPipelineFactory({
          getRoles: getRolesFactory({ db }),
          getStream: getStreamFactory({ db }),
          getAutomationProject: getAutomationProjectFactory({ db: projectDb })
        })
      )(req, res, next)
    },
    async (req, res) => {
      const branchName = req.params.branchName || 'main'
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName
      })

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
        publish
      })
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
      //TODO refactor packages/server/modules/blobstorage/index.js to use the service pattern, and then refactor this to call the service directly from here without the http overhead
      const pipedReq = request(
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

      req.pipe(pipedReq)
    }
  )

  if (isInitial) {
    listenFor('file_import_update', async (msg) => {
      const parsedMessage = parseMessagePayload(msg.payload)
      if (!parsedMessage.streamId) return
      const projectDb = await getProjectDbClient({ projectId: parsedMessage.streamId })
      await onFileImportProcessedFactory({
        getFileInfo: getFileInfoFactory({ db: projectDb }),
        publish,
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        addBranchCreatedActivity: addBranchCreatedActivityFactory({
          publish,
          saveActivity: saveActivityFactory({ db })
        })
      })(parsedMessage)
    })
    listenFor('file_import_started', async (msg) => {
      const parsedMessage = parseMessagePayload(msg.payload)
      if (!parsedMessage.streamId) return
      const projectDb = await getProjectDbClient({ projectId: parsedMessage.streamId })
      await onFileProcessingFactory({
        getFileInfo: getFileInfoFactory({ db: projectDb }),
        publish
      })(parsedMessage)
    })
  }
}
