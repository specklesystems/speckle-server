import { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import {
  SaveUploadFile,
  NotifyChangeInFileStatus,
  SaveUploadFileV2,
  SaveUploadFileInput,
  SaveUploadFileInputV2
} from '@/modules/fileuploads/domain/operations'
import {
  FileImportSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

export const insertNewUploadAndNotifyFactory =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    saveUploadFile: SaveUploadFile
    publish: PublishSubscription
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
  }

export const insertNewUploadAndNotifyFactoryV2 =
  (deps: { saveUploadFile: SaveUploadFileV2; publish: PublishSubscription }) =>
  async (upload: SaveUploadFileInputV2) => {
    await deps.saveUploadFile(upload)

    // TODO: add FE notification
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
