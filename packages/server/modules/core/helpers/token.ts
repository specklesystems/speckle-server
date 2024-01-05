import { TokenCreateError } from '@/modules/core/errors/user'
import { Scopes } from '@speckle/shared'

export const canCreateToken = (params: {
  userScopes: string[]
  tokenScopes: string[]
  strict?: boolean
}) => {
  const { userScopes, tokenScopes, strict } = params
  const hasAllScopes = tokenScopes.every((scope) => userScopes.includes(scope))
  if (!hasAllScopes) {
    if (!strict) return false
    throw new TokenCreateError(
      "You can't create a token with scopes that you don't have"
    )
  }

  return true
}

export const canCreatePAT = (params: {
  userScopes: string[]
  tokenScopes: string[]
  strict?: boolean
}) => {
  const { tokenScopes, strict } = params
  if (tokenScopes.includes(Scopes.Tokens.Write)) {
    if (!strict) return false
    throw new TokenCreateError(
      "You can't create a personal access token with the tokens:write scope"
    )
  }

  return canCreateToken(params)
}

export const canCreateAppToken = (params: {
  userScopes: string[]
  tokenScopes: string[]
  userAppId: string
  tokenAppId: string
  strict?: boolean
}) => {
  const { userAppId, tokenAppId, strict } = params
  if (userAppId !== tokenAppId || !tokenAppId?.length || !userAppId?.length) {
    if (!strict) return false
    throw new TokenCreateError(
      'An app token can only create a new token for the same app'
    )
  }

  return canCreateToken(params)
}
