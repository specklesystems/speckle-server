import { Roles } from '@speckle/shared'
import type { ServerRoles, StreamRoles } from '@speckle/shared'
import { StreamRole } from '@/graphql/generated/graphql'

/**
 * Keys for values stored in localStorage
 */
export const LocalStorageKeys = Object.freeze({
  AuthToken: 'AuthToken',
  RefreshToken: 'RefreshToken',
  Uuid: 'uuid',
  ShouldRedirectTo: 'shouldRedirectTo'
})

/**
 * Our GQL schema has a StreamRoles enum that unfortunately can't have the same exact values as our roles constants, because
 * we can't use colons (:) there. So you can use this function to map from our constant value to the GQL one.
 */
export function streamRoleToGraphQLEnum(role: StreamRoles): StreamRole {
  switch (role) {
    case Roles.Stream.Owner:
      return StreamRole.StreamOwner
    case Roles.Stream.Reviewer:
      return StreamRole.StreamReviewer
    case Roles.Stream.Contributor:
    default:
      return StreamRole.StreamContributor
  }
}

export { Roles, ServerRoles, StreamRoles }
