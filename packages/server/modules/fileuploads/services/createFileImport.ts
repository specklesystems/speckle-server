import type { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { Scopes } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import type { PushJobToFileImporter } from '@/modules/fileuploads/domain/operations'
import {
  maximumAllowedQueuingProcessingAndRetryTimeMs,
  singleAttemptMaximumProcessingTimeSeconds
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
    blobId
  }): Promise<void> => {
    const token = await deps.createAppToken({
      appId: DefaultAppIds.Web,
      name: `fileimport-${projectId}@${modelId}`,
      userId,
      scopes: [
        Scopes.Streams.Write,
        Scopes.Streams.Read,
        Scopes.Profile.Read,
        Scopes.Profile.Email
      ],
      lifespan: maximumAllowedQueuingProcessingAndRetryTimeMs(),
      limitResources: [
        {
          id: projectId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })

    await scheduleJob({
      fileName,
      token,
      serverUrl: deps.getServerOrigin(),
      modelId,
      fileType,
      projectId,
      timeOutSeconds: singleAttemptMaximumProcessingTimeSeconds(),
      blobId
    })
  }
