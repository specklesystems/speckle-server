import { FileImportSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'
import { getFileInfo } from '@/modules/fileuploads/repositories/fileUploads'
import { ProjectPendingModelsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'

async function messageProcessor(msg: MessageType) {
  const uploadId = msg.payload
  const upload = await getFileInfo({ fileId: uploadId })
  if (!upload) return

  await publish(FileImportSubscriptions.ProjectProjectPendingModelsUpdated, {
    projectPendingModelsUpdated: {
      id: upload.id,
      type: ProjectPendingModelsUpdatedMessageType.Updated,
      model: upload
    },
    projectId: upload.streamId
  })
}

export function listenForImportUpdates() {
  listenFor('file_import_update', messageProcessor)
}
