import { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import { GetModelById } from '@/modules/core/domain/models/operations'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { SaveUploadFile } from '@/modules/fileuploads/domain/operations'
import { SaveUploadFileInput } from '@/modules/fileuploads/repositories/fileUploads'
import {
  FileImportSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

/**
 * @deprecated
 **/
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

export const createUploadFileFactory =
  ({
    getModelById,
    saveUploadFile,
    publish
  }: {
    getModelById: GetModelById
    saveUploadFile: SaveUploadFile
    publish: PublishSubscription
  }) =>
  async ({
    modelId,
    projectId,
    userId,
    upload
  }: {
    projectId: string
    modelId: string
    userId: string
    upload: { fileId: string; fileName: string; fileType: string; fileSize: number }
  }) => {
    const model = await getModelById({ id: modelId })
    const file = await saveUploadFile({
      ...upload,
      streamId: projectId,
      userId,
      branchName: model?.name ?? 'main' // This code assumes main model is always present in the project
    })

    if (!model) {
      await publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
        projectPendingModelsUpdated: {
          id: file.id,
          type: ProjectPendingModelsUpdatedMessageType.Created,
          model: file
        },
        projectId: file.streamId
      })
    } else {
      await publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: file.id,
          type: ProjectPendingVersionsUpdatedMessageType.Created,
          version: file
        },
        projectId: file.streamId,
        branchName: file.branchName!
      })
    }

    await publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: file.id,
        type: ProjectFileImportUpdatedMessageType.Created,
        upload: file
      },
      projectId: file.streamId
    })
  }
