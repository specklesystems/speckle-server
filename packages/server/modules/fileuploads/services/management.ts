import { ProjectPendingModelsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import {
  saveUploadFile,
  SaveUploadFileInput
} from '@/modules/fileuploads/repositories/fileUploads'
import { FileImportSubscriptions, publish } from '@/modules/shared/utils/subscriptions'

export async function insertNewUploadAndNotify(upload: SaveUploadFileInput) {
  const file = await saveUploadFile(upload)
  await publish(FileImportSubscriptions.ProjectProjectPendingModelsUpdated, {
    projectPendingModelsUpdated: {
      id: file.id,
      type: ProjectPendingModelsUpdatedMessageType.Created,
      model: file
    },
    projectId: file.streamId
  })
}
