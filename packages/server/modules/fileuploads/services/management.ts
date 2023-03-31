import {
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import {
  saveUploadFile,
  SaveUploadFileInput
} from '@/modules/fileuploads/repositories/fileUploads'
import { FileImportSubscriptions, publish } from '@/modules/shared/utils/subscriptions'

export async function insertNewUploadAndNotify(upload: SaveUploadFileInput) {
  const branch = await getStreamBranchByName(upload.streamId, upload.branchName)
  const file = await saveUploadFile(upload)

  if (!branch) {
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
      branchName: file.branchName
    })
  }
}
