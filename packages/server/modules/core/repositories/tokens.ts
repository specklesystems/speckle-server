import { ApiTokens, ServerApps, UserServerAppTokens } from '@/modules/core/dbSchema'
import { ServerAppRecord } from '@/modules/core/helpers/types'

export async function getTokenAppInfo(params: { token: string; appId?: string }) {
  const { token, appId } = params
  const tokenId = token.slice(0, 10)

  const q = ApiTokens.knex()
    .select<ServerAppRecord[]>(ServerApps.cols)
    .where({
      [ApiTokens.col.id]: tokenId,
      ...(appId
        ? {
            [UserServerAppTokens.col.appId]: appId
          }
        : {})
    })
    .innerJoin(
      UserServerAppTokens.name,
      ApiTokens.col.id,
      UserServerAppTokens.col.tokenId
    )
    .innerJoin(ServerApps.name, ServerApps.col.id, UserServerAppTokens.col.appId)
    .first()

  return await q
}
