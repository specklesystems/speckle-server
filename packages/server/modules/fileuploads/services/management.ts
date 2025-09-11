import type {
  NotifyChangeInFileStatus,
  SaveUploadFile,
  PushJobToFileImporter,
  GetModelUploads,
  GetModelUploadsItems,
  GetModelUploadsTotalCount,
  InsertNewUploadAndNotify,
  FindQueue
} from '@/modules/fileuploads/domain/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { UnsupportedFileTypeError } from '@/modules/fileuploads/helpers/errors'

export const insertNewUploadAndNotifyFactory =
  (deps: {
    findQueue: FindQueue
    pushJobToFileImporter: PushJobToFileImporter
    saveUploadFile: SaveUploadFile
    emit: EventBusEmit
  }): InsertNewUploadAndNotify =>
  async (upload) => {
    const file = await deps.saveUploadFile(upload)
    const queue = deps.findQueue({ fileType: file.fileType.toLocaleLowerCase() })
    if (!queue) {
      throw new UnsupportedFileTypeError()
    }

    await deps.pushJobToFileImporter({
      scheduleJob: queue.scheduleJob,
      fileName: file.fileName,
      fileType: file.fileType,
      projectId: file.projectId,
      modelId: upload.modelId,
      blobId: file.id,
      userId: upload.userId
    })

    await deps.emit({
      eventName: FileuploadEvents.Started,
      payload: {
        upload: {
          ...file,
          performanceData: null,
          streamId: upload.projectId,
          projectId: upload.projectId,
          branchName: upload.modelName
        }
      }
    })

    return file
  }

export const notifyChangeInFileStatus =
  (deps: { eventEmit: EventBusEmit }): NotifyChangeInFileStatus =>
  async (params) => {
    const { file } = params

    await deps.eventEmit({
      eventName: FileuploadEvents.Updated,
      payload: {
        upload: {
          ...file,
          projectId: file.streamId
        },
        isNewModel: false // next gen file uploads dont support this
      }
    })
  }

export const getModelUploadsFactory =
  (deps: {
    getModelUploadsItems: GetModelUploadsItems
    getModelUploadsTotalCount: GetModelUploadsTotalCount
  }): GetModelUploads =>
  async (params) => {
    const [{ items, cursor }, totalCount] = await Promise.all([
      params.limit === 0
        ? { items: [], cursor: null }
        : deps.getModelUploadsItems(params),
      deps.getModelUploadsTotalCount(params)
    ])

    return {
      items,
      totalCount,
      cursor
    }
  }
