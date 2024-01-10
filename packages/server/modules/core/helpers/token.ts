import { TokenCreateError } from '@/modules/core/errors/user'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { TokenResourceAccessRecord } from '@/modules/core/helpers/types'
import { ResourceTargets } from '@/modules/serverinvites/helpers/inviteHelper'
import { MaybeNullOrUndefined, Scopes } from '@speckle/shared'
import { differenceBy } from 'lodash'

export const resourceAccessRuleToIdentifier = (
  rule: TokenResourceAccessRecord
): TokenResourceIdentifier => {
  return {
    id: rule.resourceId,
    type: rule.resourceType
  }
}

export const roleResourceTypeToTokenResourceType = (
  type: string
): TokenResourceIdentifierType => {
  switch (type) {
    case ResourceTargets.Streams:
      return TokenResourceIdentifierType.Project
    default:
      throw new Error(`Invalid resource type: ${type}`)
  }
}

/**
 * Role resource targets that we support for token resource limits
 */
export const supportedResourceTargets = <const>[ResourceTargets.Streams]

const canCreateToken = (params: {
  scopes: {
    user: string[]
    token: string[]
  }
  limitedResources?: {
    user: MaybeNullOrUndefined<TokenResourceIdentifier[]>
    token: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }
}) => {
  const { scopes, limitedResources } = params
  const hasAllScopes = scopes.token.every((scope) => scopes.user.includes(scope))
  if (!hasAllScopes) {
    throw new TokenCreateError(
      "You can't create a token with scopes that you don't have"
    )
  }

  const userLimitedResources = limitedResources?.user
  const tokenLimitedResources = limitedResources?.token

  let throwAboutInvalidResources = false
  if (userLimitedResources?.length || tokenLimitedResources?.length) {
    if (userLimitedResources?.length && !tokenLimitedResources?.length) {
      throwAboutInvalidResources = true
    } else if (userLimitedResources?.length) {
      const disallowedResources = differenceBy(
        tokenLimitedResources || [],
        userLimitedResources || [],
        (r) => `${r.type}:${r.id}`
      )

      if (disallowedResources.length) {
        throwAboutInvalidResources = true
      }
    }
  }

  if (throwAboutInvalidResources) {
    throw new TokenCreateError(
      `You can't create a token with access to resources that you don't have access to`
    )
  }

  return true
}

export const canCreatePAT = (params: {
  scopes: {
    user: string[]
    token: string[]
  }
}) => {
  const { scopes } = params
  if (scopes.token.includes(Scopes.Tokens.Write)) {
    throw new TokenCreateError(
      "You can't create a personal access token with the tokens:write scope"
    )
  }

  return canCreateToken(params)
}

export const canCreateAppToken = (params: {
  scopes: {
    user: string[]
    token: string[]
  }
  appId: {
    user: string
    token: string
  }
  limitedResources: {
    user: MaybeNullOrUndefined<TokenResourceIdentifier[]>
    token: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }
}) => {
  const { appId } = params
  if (appId.user !== appId.token || !appId.token?.length || !appId.user?.length) {
    throw new TokenCreateError(
      'An app token can only create a new token for the same app'
    )
  }

  return canCreateToken(params)
}
