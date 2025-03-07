import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import {
  CreateObjectPreview,
  RequestObjectPreview,
  StoreObjectPreview
} from '@/modules/previews/domain/operations'
import { Roles, Scopes } from '@speckle/shared'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'

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

    // we're running the preview generation in the name of a project owner
    const token = await createAppToken({
      appId: DefaultAppIds.Web,
      name: `preview-${streamId}@${objectId}`,
      userId,
      scopes: [Scopes.Streams.Read],
      lifespan: 120 * 60 * 1000, // for now, lets make this valid for 2 hours
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
    await requestObjectPreview({ jobId: `${streamId}.${objectId}`, token, url })
    await storeObjectPreview({ streamId, objectId, priority })
  }
