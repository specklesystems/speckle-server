import {
  FileImportSubscriptions,
  publish,
  type PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { GetFileInfo } from '@/modules/fileuploads/domain/operations'
import { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import { AddBranchCreatedActivity } from '@/modules/activitystream/domain/operations'

type OnFileImportProcessedDeps = {
  getFileInfo: GetFileInfo
  getStreamBranchByName: GetStreamBranchByName
  publish: PublishSubscription
  addBranchCreatedActivity: AddBranchCreatedActivity
}

type ParsedMessage = {
  uploadId: string | null
  streamId: string | null
  branchName: string | null
  isNewBranch: boolean
}
const branchCreatedPayloadRegexp = /^(.+):::(.+):::(.+):::(.+)$/i
export const parseMessagePayload = (payload: string): ParsedMessage => {
  const [, uploadId, streamId, branchName, newBranchCreated] =
    branchCreatedPayloadRegexp.exec(payload) || [null, null, null, null]

  const isNewBranch = newBranchCreated === '1'
  return { uploadId, streamId, branchName, isNewBranch }
}

export const onFileImportProcessedFactory =
  (deps: OnFileImportProcessedDeps) =>
  async ({ uploadId, streamId, branchName, isNewBranch }: ParsedMessage) => {
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

export const onFileProcessingFactory =
  (deps: OnFileProcessingDeps) =>
  async ({ uploadId }: ParsedMessage) => {
    if (!uploadId) return
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
