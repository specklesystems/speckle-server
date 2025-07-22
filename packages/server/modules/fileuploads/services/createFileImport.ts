import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { Scopes, TIME, TIME_MS } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { PushJobToFileImporter } from '@/modules/fileuploads/domain/operations'
import { getFileImportTimeLimitMinutes } from '@/modules/shared/helpers/envHelper'
import {
  DelayBetweenFileImportRetriesMinutes,
  NumberOfFileImportRetries
} from '@/modules/fileuploads/domain/consts'

export const pushJobToFileImporterFactory =
  (deps: {
    createAppToken: CreateAndStoreAppToken
    getServerOrigin: () => string
  }): PushJobToFileImporter =>
  async ({
    scheduleJob,
    modelId,
    projectId,
    userId,
    fileName,
    fileType,
    blobId,
    jobId
  }): Promise<void> => {
    const token = await deps.createAppToken({
      appId: DefaultAppIds.Web,
      name: `fileimport-${projectId}@${modelId}`,
      userId,
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read, Scopes.Profile.Read],
      lifespan:
        NumberOfFileImportRetries *
        (getFileImportTimeLimitMinutes() + DelayBetweenFileImportRetriesMinutes + 1) *
        TIME_MS.minute, // allowing an extra minute for some buffer
      limitResources: [
        {
          id: projectId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })

    await scheduleJob({
      jobId,
      fileName,
      token,
      serverUrl: deps.getServerOrigin(),
      modelId,
      fileType,
      projectId,
      timeOutSeconds: getFileImportTimeLimitMinutes() * TIME.minute,
      blobId
    })
  }
