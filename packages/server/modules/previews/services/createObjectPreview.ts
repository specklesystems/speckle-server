import { DefaultAppIds } from '@/modules/auth/defaultApps'
import type { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import type { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import type {
  CreateObjectPreview,
  RequestObjectPreview,
  StoreObjectPreview
} from '@/modules/previews/domain/operations'
import { Roles, Scopes, TIME_MS } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { toJobId } from '@speckle/shared/workers/previews'

export const createObjectPreviewFactory =
  ({
    getStreamCollaborators,
    createAppToken,
    requestObjectPreview,
    storeObjectPreview,
    serverOrigin
  }: {
    getStreamCollaborators: GetStreamCollaborators
    serverOrigin: string
    createAppToken: CreateAndStoreAppToken
    requestObjectPreview: RequestObjectPreview
    storeObjectPreview: StoreObjectPreview
  }): CreateObjectPreview =>
  async ({ streamId, objectId, priority }) => {
    const owners = await getStreamCollaborators(streamId, Roles.Stream.Owner)
    // there is always an owner, this is safe
    const userId = owners[0].id

    // use the database as a lock to prevent multiple jobs being created
    try {
      await storeObjectPreview({
        streamId,
        objectId,
        priority
      })
    } catch {
      return false
    }

    const jobId = toJobId({ projectId: streamId, objectId })

    // we're running the preview generation in the name of a project owner
    const token = await createAppToken({
      appId: DefaultAppIds.Web,
      name: `preview-${jobId}`,
      userId,
      scopes: [Scopes.Streams.Read],
      lifespan: 2 * TIME_MS.hour,
      limitResources: [
        {
          id: streamId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })
    const url = new URL(
      `/projects/${streamId}/models/${objectId}`,
      serverOrigin
    ).toString()

    await requestObjectPreview({
      jobId,
      token,
      url
    })
    return true
  }
