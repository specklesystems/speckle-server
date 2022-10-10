import { LimitedUser, Stream, StreamRole } from '@/modules/core/graph/generated/graphql'
import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'

/**
 * The types of objects we return in resolvers often don't have the exact type as the object in the schema.
 * Often some fields will be missing, because they are defined as separate resolvers and thus don't need
 * to be defined on the object being returned.
 *
 * These are registered in the server's codegen.yml
 */

export type StreamGraphQLReturn = Omit<
  Stream,
  | 'pendingAccessRequests'
  | 'activity'
  | 'blobs'
  | 'blob'
  | 'commentCount'
  | 'branches'
  | 'branch'
  | 'commit'
  | 'commits'
  | 'object'
  | 'collaborators'
  | 'pendingCollaborators'
  | 'favoritedDate'
  | 'favoritesCount'
  | 'role'
  | 'fileUploads'
  | 'fileUpload'
  | 'webhooks'
>

export type LimitedUserGraphQLReturn = Omit<
  LimitedUser,
  'totalOwnedStreamsFavorites' | 'commits' | 'streams'
>

/**
 * Map GQL StreamRole enum to the value types we use in the backend
 */
export function mapStreamRoleToValue(graphqlStreamRole: StreamRole): StreamRoles {
  switch (graphqlStreamRole) {
    case StreamRole.StreamReviewer:
      return Roles.Stream.Reviewer
    case StreamRole.StreamOwner:
      return Roles.Stream.Owner
    case StreamRole.StreamContributor:
    default:
      return Roles.Stream.Contributor
  }
}
