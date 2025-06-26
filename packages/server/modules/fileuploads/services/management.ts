import type { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import type {
  SaveUploadFile,
  NotifyChangeInFileStatus,
  SaveUploadFileV2,
  PushJobToFileImporter,
  GetModelUploads,
  GetModelUploadsItems,
  GetModelUploadsTotalCount,
  InsertNewUploadAndNotifyV2,
  InsertNewUploadAndNotify
} from '@/modules/fileuploads/domain/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import {
  FileImportSubscriptions,
  type PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'
import { UnsupportedFileTypeError } from '@/modules/fileuploads/helpers/errors'

export const insertNewUploadAndNotifyFactory =
  (deps: {
    saveUploadFile: SaveUploadFile
    emit: EventBusEmit
  }): InsertNewUploadAndNotify =>
  async (upload) => {
    const file = await deps.saveUploadFile(upload)

    await deps.emit({
      eventName: FileuploadEvents.Started,
      payload: {
        upload: {
          ...file,
          projectId: upload.streamId
        }
      }
    })

    return file
  }

export const insertNewUploadAndNotifyFactoryV2 =
  (deps: {
    queues: Pick<FileImportQueue, 'scheduleJob' | 'supportedFileTypes'>[]
    pushJobToFileImporter: PushJobToFileImporter
    saveUploadFile: SaveUploadFileV2
    emit: EventBusEmit
  }): InsertNewUploadAndNotifyV2 =>
  async (upload) => {
    const file = await deps.saveUploadFile(upload)
    const queue = deps.queues.find((q) =>
      q.supportedFileTypes.includes(file.fileType.toLocaleLowerCase())
    )
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
      jobId: file.id,
      userId: upload.userId
    })

    await deps.emit({
      eventName: FileuploadEvents.Started,
      payload: {
        upload: {
          ...file,
          streamId: upload.projectId,
          projectId: upload.projectId,
          branchName: upload.modelName
        }
      }
    })

    return file
  }

export const notifyChangeInFileStatus =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    publish: PublishSubscription
  }): NotifyChangeInFileStatus =>
  async (params) => {
    const { file } = params
    const { id: fileId, streamId, branchName } = file
    const branch = await deps.getStreamBranchByName(streamId, branchName)

    if (!branch) {
      await deps.publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
        projectPendingModelsUpdated: {
          id: fileId,
          type: ProjectPendingModelsUpdatedMessageType.Updated,
          model: file
        },
        projectId: streamId
      })
    } else {
      await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: fileId,
          type: ProjectPendingVersionsUpdatedMessageType.Updated,
          version: file
        },
        projectId: streamId,
        branchName
      })
    }

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: fileId,
        type: ProjectFileImportUpdatedMessageType.Created,
        upload: file
      },
      projectId: streamId
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
