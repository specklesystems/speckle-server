import { Stream, StreamRole } from '@/modules/core/graph/generated/graphql'
import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'

/**
 * The types of objects we return in resolvers often don't have the exact type as the object in the schema.
 * Often some fields will be missing, because they are defined as separate resolvers and thus don't need
 * to be defined on the object being returned.
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

/**
 * Map GQL StreamRole enum to the value types we use in the backend
 */
export function mapStreamRoleToValue(graphqlStreamRole: StreamRole): StreamRoles {
  switch (graphqlStreamRole) {
    case 'STREAM_REVIEWER':
      return Roles.Stream.Reviewer
    case 'STREAM_OWNER':
      return Roles.Stream.Owner
    case 'STREAM_CONTRIBUTOR':
    default:
      return Roles.Stream.Contributor
  }
}
