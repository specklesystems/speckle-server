import { AuthorizationCodes, RefreshTokens, knex } from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type RefreshTokenRecord = {
  id: string
  tokenDigest: string
  appId: string
  userId: string
  createdAt: string
  lifespan: number
}

export type AuthorizationCodeRecord = {
  id: string
  appId: string
  userId: string
  challenge: string
  createdAt: string
  lifespan: number
}

export type ApiTokenRecord = {
  id: string
  tokenDigest: string
  owner: string
  name: Nullable<string>
  lastChars: Nullable<string>
  revoked: boolean
  lifespan: number
  createdAt: string
  lastUsed: string
}

export async function deleteExistingAuthTokens(userId: string) {
  if (!userId) throw new InvalidArgumentError('User ID must be set')

  await RefreshTokens.knex().where(RefreshTokens.col.userId, userId)
  await AuthorizationCodes.knex().where(AuthorizationCodes.col.userId, userId)
  await knex.raw(
    `
        DELETE FROM api_tokens
        WHERE owner = ?
        AND id NOT IN (
          SELECT p."tokenId" FROM personal_api_tokens p WHERE p."userId" = ?
        )
        `,
    [userId, userId]
  )
}
