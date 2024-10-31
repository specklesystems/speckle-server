import {
  FileImportSubscriptions,
  publish,
  type PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { trim } from 'lodash'
import { GetFileInfo } from '@/modules/fileuploads/domain/operations'
import { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import { AddBranchCreatedActivity } from '@/modules/activitystream/domain/operations'

const branchCreatedPayloadRegexp = /^(.+):::(.+):::(.+):::(.+)$/i

type OnFileImportProcessedDeps = {
  getFileInfo: GetFileInfo
  getStreamBranchByName: GetStreamBranchByName
  publish: PublishSubscription
  addBranchCreatedActivity: AddBranchCreatedActivity
}

const onFileImportProcessedFactory =
  (deps: OnFileImportProcessedDeps) => async (msg: MessageType) => {
    const [, uploadId, streamId, branchName, newBranchCreated] =
      branchCreatedPayloadRegexp.exec(msg.payload) || [null, null, null]
    const isNewBranch = newBranchCreated === '1'

    if (!uploadId || !streamId || !branchName) return

    const [upload, branch] = await Promise.all([
      deps.getFileInfo({ fileId: uploadId }),
      isNewBranch ? deps.getStreamBranchByName(streamId, branchName) : null
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

      if (branch) await deps.addBranchCreatedActivity({ branch })
    } else {
      await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: upload.id,
          type: ProjectPendingVersionsUpdatedMessageType.Updated,
          version: upload
        },
        projectId: upload.streamId,
        branchName: upload.branchName
      })
    }

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: upload.id,
        type: ProjectFileImportUpdatedMessageType.Updated,
        upload
      },
      projectId: upload.streamId
    })
  }

type OnFileProcessingDeps = {
  getFileInfo: GetFileInfo
  publish: PublishSubscription
}

const onFileProcessingFactory =
  (deps: OnFileProcessingDeps) => async (msg: MessageType) => {
    const uploadId = trim(msg.payload)
    const upload = await deps.getFileInfo({ fileId: uploadId })
    if (!upload) return

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: upload.id,
        type: ProjectFileImportUpdatedMessageType.Updated,
        upload
      },
      projectId: upload.streamId
    })
  }

export const listenForImportUpdatesFactory =
  (deps: OnFileImportProcessedDeps & OnFileProcessingDeps) => () => {
    const onFileImportProcessed = onFileImportProcessedFactory(deps)
    const onFileProcessing = onFileProcessingFactory(deps)

    listenFor('file_import_update', onFileImportProcessed)
    listenFor('file_import_started', onFileProcessing)
  }
