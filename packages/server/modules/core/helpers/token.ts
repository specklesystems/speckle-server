import { TokenCreateError } from '@/modules/core/errors/user'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { TokenResourceAccessRecord } from '@/modules/core/helpers/types'
import { ResourceTargets } from '@/modules/serverinvites/helpers/inviteHelper'
import { MaybeNullOrUndefined, Nullable, Optional, Scopes } from '@speckle/shared'
import { differenceBy } from 'lodash'

export type ContextResourceAccessRules = MaybeNullOrUndefined<TokenResourceIdentifier[]>

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
): Nullable<TokenResourceIdentifierType> => {
  switch (type) {
    case ResourceTargets.Streams:
      return TokenResourceIdentifierType.Project
    default:
      return null
  }
}

export const isResourceAllowed = (params: {
  resourceId: string
  resourceType: TokenResourceIdentifierType
  resourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
}) => {
  const { resourceId, resourceType, resourceAccessRules } = params
  const relevantRules = resourceAccessRules?.filter((r) => r.type === resourceType)
  return !relevantRules?.length || relevantRules.some((r) => r.id === resourceId)
}

export const isNewResourceAllowed = (params: {
  resourceType: TokenResourceIdentifierType
  resourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
}) => {
  const { resourceType, resourceAccessRules } = params
  const relevantRules = resourceAccessRules?.filter((r) => r.type === resourceType)
  return !relevantRules?.length
}

export const toProjectIdWhitelist = (
  resourceAccessRules: ContextResourceAccessRules
): Optional<string[]> => {
  const projectRules = resourceAccessRules?.filter(
    (r) => r.type === TokenResourceIdentifierType.Project
  )
  return projectRules?.map((r) => r.id)
}

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
      `You can't create a token with access to resources that you don't currently have access to`
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
