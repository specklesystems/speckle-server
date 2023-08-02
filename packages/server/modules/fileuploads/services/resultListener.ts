import { FileImportSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'
import { getFileInfo } from '@/modules/fileuploads/repositories/fileUploads'
import {
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'

const branchCreatedPayloadRegexp = /^(.+):::(.+):::(.+):::(.+)$/i

async function onFileImportProcessed(msg: MessageType) {
  const [, uploadId, streamId, branchName, newBranchCreated] =
    branchCreatedPayloadRegexp.exec(msg.payload) || [null, null, null]
  const isNewBranch = newBranchCreated === '1'

  if (!uploadId || !streamId || !branchName) return

  const [upload, branch] = await Promise.all([
    getFileInfo({ fileId: uploadId }),
    isNewBranch ? getStreamBranchByName(streamId, branchName) : null
  ])
  if (!upload) return

  if (isNewBranch) {
    await publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
      projectPendingModelsUpdated: {
        id: upload.id,
        type: ProjectPendingModelsUpdatedMessageType.Updated,
        model: upload
      },
      projectId: upload.streamId
    })

    if (branch) await addBranchCreatedActivity({ branch })
  } else {
    await publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
      projectPendingVersionsUpdated: {
        id: upload.id,
        type: ProjectPendingVersionsUpdatedMessageType.Updated,
        version: upload
      },
      projectId: upload.streamId,
      branchName: upload.branchName
    })
  }
}

export function listenForImportUpdates() {
  listenFor('file_import_update', onFileImportProcessed)
}
