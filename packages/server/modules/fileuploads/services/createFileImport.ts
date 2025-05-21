import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { Scopes, TIME, TIME_MS } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/test/graphql/generated/graphql'
import {
  PushJobToFileImporter,
  ScheduleFileimportJob
} from '@/modules/fileuploads/domain/operations'

const twentyMinutes = 20 * TIME.minute

export const pushJobToFileImporterFactory =
  (deps: {
    createAppToken: CreateAndStoreAppToken
    getServerOrigin: () => string
    scheduleJob: ScheduleFileimportJob
  }): PushJobToFileImporter =>
  async ({
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
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read],
      lifespan: 2 * TIME_MS.hour,
      limitResources: [
        {
          id: projectId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })

    await deps.scheduleJob({
      jobId,
      fileName,
      token,
      serverUrl: deps.getServerOrigin(),
      modelId,
      fileType,
      projectId,
      timeOutSeconds: twentyMinutes,
      blobId
    })
  }
