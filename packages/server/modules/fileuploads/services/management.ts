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
  SaveUploadFileInput,
  PushJobToFileImporter,
  InsertNewUploadAndNotify
} from '@/modules/fileuploads/domain/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import {
  FileImportSubscriptions,
  type PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'
import { UnsupportedFileTypeError } from '@/modules/fileuploads/errors'

export const insertNewUploadAndNotifyFactory =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    saveUploadFile: SaveUploadFile
    publish: PublishSubscription
    emit: EventBusEmit
  }) =>
  async (upload: SaveUploadFileInput) => {
    const branch = await deps.getStreamBranchByName(upload.streamId, upload.branchName)
    const file = await deps.saveUploadFile(upload)

    if (!branch) {
      await deps.publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
        projectPendingModelsUpdated: {
          id: file.id,
          type: ProjectPendingModelsUpdatedMessageType.Created,
          model: file
        },
        projectId: file.streamId
      })
    } else {
      await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: file.id,
          type: ProjectPendingVersionsUpdatedMessageType.Created,
          version: file
        },
        projectId: file.streamId,
        branchName: file.branchName
      })
    }

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: file.id,
        type: ProjectFileImportUpdatedMessageType.Created,
        upload: file
      },
      projectId: file.streamId
    })

    await deps.emit({
      eventName: FileuploadEvents.Started,
      payload: {
        userId: file.userId,
        projectId: file.streamId,
        fileSize: file.fileSize,
        fileType: file.fileType
      }
    })
  }

export const insertNewUploadAndNotifyFactoryV2 =
  (deps: {
    queues: FileImportQueue[]
    pushJobToFileImporter: PushJobToFileImporter
    saveUploadFile: SaveUploadFileV2
    publish: PublishSubscription
    emit: EventBusEmit
  }): InsertNewUploadAndNotify =>
  async (upload) => {
    const file = await deps.saveUploadFile(upload)

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: file.id,
        type: ProjectFileImportUpdatedMessageType.Created,
        upload: {
          ...file,
          streamId: upload.projectId,
          branchName: upload.modelName
        }
      },
      projectId: file.projectId
    })

    const queue = deps.queues.find((q) =>
      q.supportedFileTypes.includes(file.fileType.toLocaleLowerCase())
    )
    if (!queue) {
      throw new UnsupportedFileTypeError()
    }

    await deps.pushJobToFileImporter({
      queue,
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
        userId: file.userId,
        projectId: file.projectId,
        fileSize: file.fileSize,
        fileType: file.fileType
      }
    })
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
