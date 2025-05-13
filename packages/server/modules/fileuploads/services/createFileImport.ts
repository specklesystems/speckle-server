import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { Scopes, TIME, TIME_MS } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/test/graphql/generated/graphql'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { scheduleJob } from '@/modules/fileuploads/queues/fileimports'
import { PushJobToFileImporter } from '@/modules/fileuploads/domain/operations'

const twentyMinutes = 20 * TIME.minute

export const pushJobToFileImporterFactory =
  (deps: {
    createAppToken: CreateAndStoreAppToken
    getServerOrigin: typeof getServerOrigin
    scheduleJob: typeof scheduleJob
  }): PushJobToFileImporter =>
  async ({ modelId, projectId, userId, fileType, blobId, jobId }): Promise<void> => {
    const token = await deps.createAppToken({
      appId: DefaultAppIds.Web,
      name: `fileimport-${projectId}@${modelId}`,
      userId,
      scopes: [Scopes.Streams.Write],
      lifespan: 2 * TIME_MS.hour,
      limitResources: [
        {
          id: projectId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })

    const url = new URL(
      `/projects/${projectId}/fileimporter/jobs/${jobId}/results`,
      deps.getServerOrigin()
    ).toString()

    await deps.scheduleJob({
      type: 'file-import',
      payload: {
        token,
        url,
        modelId,
        fileType,
        projectId,
        timeOutSeconds: twentyMinutes,
        blobId
      }
    })
  }
