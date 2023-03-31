import { FileImportSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'
import { getFileInfo } from '@/modules/fileuploads/repositories/fileUploads'
import { ProjectPendingModelsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
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

  await publish(FileImportSubscriptions.ProjectProjectPendingModelsUpdated, {
    projectPendingModelsUpdated: {
      id: upload.id,
      type: ProjectPendingModelsUpdatedMessageType.Updated,
      model: upload
    },
    projectId: upload.streamId
  })

  if (branch && isNewBranch) {
    await addBranchCreatedActivity({ branch })
  }
}

export function listenForImportUpdates() {
  listenFor('file_import_update', onFileImportProcessed)
}
