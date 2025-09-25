import type {
  CreateAndStoreUserToken,
  GetApiTokenById
} from '@/modules/core/domain/tokens/operations'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { LogicError } from '@/modules/shared/errors'
import type { StoreSavedViewGroupApiToken } from '@/modules/viewer/domain/operations/savedViewGroupApiTokens'
import type { GetSavedViewGroup } from '@/modules/viewer/domain/operations/savedViews'
import type {
  SavedViewGroupApiToken,
  SavedViewGroupApiTokenRecord
} from '@/modules/viewer/domain/types/savedViewGroupApiTokens'
import { Scopes } from '@speckle/shared'
import { SavedViewGroupNotFoundError } from '@speckle/shared/authz'
import cryptoRandomString from 'crypto-random-string'
import { pick } from 'lodash-es'

export type CreateAndStoreSavedViewGroupToken = (args: {
  savedViewGroupId: string
  userId: string
  projectId: string
  lifespan?: number | bigint
}) => Promise<{
  token: string
  tokenMetadata: SavedViewGroupApiToken
}>

export const createSavedViewGroupTokenFactory =
  (deps: {
    getSavedViewGroup: GetSavedViewGroup
    createToken: CreateAndStoreUserToken
    getToken: GetApiTokenById
    storeSavedViewGroupApiToken: StoreSavedViewGroupApiToken
  }): CreateAndStoreSavedViewGroupToken =>
  async ({ projectId, savedViewGroupId, userId, lifespan }) => {
    const savedViewGroups = await deps.getSavedViewGroup({
      id: savedViewGroupId,
      projectId
    })

    if (!savedViewGroups) throw new SavedViewGroupNotFoundError()
    if (projectId !== savedViewGroups.projectId) throw new LogicError()

    const { id, token } = await deps.createToken({
      userId,
      name: `svgat-${cryptoRandomString({ length: 10 })}`,
      scopes: [Scopes.Streams.Read, Scopes.Users.Read],
      limitResources: [
        {
          id: projectId,
          type: TokenResourceIdentifierType.Project
        }
      ],
      lifespan
    })

    const tokenMetadata: SavedViewGroupApiTokenRecord = {
      userId,
      projectId,
      savedViewGroupId,
      tokenId: id,
      content: token
    }

    await deps.storeSavedViewGroupApiToken(tokenMetadata)

    const apiToken = await deps.getToken(id)

    if (!apiToken) {
      throw new LogicError('Failed to create api token for dashboard')
    }

    return {
      token,
      tokenMetadata: {
        revoked: false,
        ...tokenMetadata,
        ...pick(apiToken, 'createdAt', 'lastUsed', 'lifespan')
      }
    }
  }
