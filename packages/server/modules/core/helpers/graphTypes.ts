import {
  CommitWithStreamBranchId,
  LegacyStreamCommit,
  LegacyUserCommit
} from '@/modules/core/domain/commits/types'
import {
  LimitedUser,
  StreamRole,
  ServerRole,
  ModelsTreeItem
} from '@/modules/core/graph/generated/graphql'
import { Roles, ServerRoles, StreamRoles } from '@/modules/core/helpers/mainConstants'
import {
  BranchRecord,
  CommitRecord,
  ObjectRecord,
  ServerInfo,
  StreamRecord,
  UserRecord
} from '@/modules/core/helpers/types'
import { MaybeNullOrUndefined } from '@speckle/shared'

/**
 * The types of objects we return in resolvers often don't have the exact type as the object in the schema.
 * Often some fields will be missing, because they are defined as separate resolvers and thus don't need
 * to be defined on the object being returned.
 *
 * These are registered in the server's codegen.yml
 */

export type StreamGraphQLReturn = StreamRecord & {
  /**
   * Some queries resolve the role, some don't. If role isn't returned, no worries, it'll
   * be resolved by the Project.role/Stream.role resolver in an efficient manner.
   */
  role?: string | null
}

export type CommitGraphQLReturn = (
  | CommitRecord
  | LegacyStreamCommit
  | LegacyUserCommit
) & { streamId: string }

export type BranchGraphQLReturn = BranchRecord

export type ProjectGraphQLReturn = StreamGraphQLReturn

export type ModelGraphQLReturn = BranchRecord

export type VersionGraphQLReturn = CommitWithStreamBranchId

export type LimitedUserGraphQLReturn = Omit<
  LimitedUser,
  'totalOwnedStreamsFavorites' | 'commits' | 'streams'
>

export type UserGraphQLReturn = Pick<
  UserRecord,
  'id' | 'createdAt' | 'name' | 'bio' | 'company' | 'email' | 'verified' | 'avatar'
>

export type ModelsTreeItemGraphQLReturn = Omit<ModelsTreeItem, 'model' | 'children'> & {
  /**
   * Required for field resolvers, not actually returned in response
   */
  projectId: string
}

export type ObjectGraphQLReturn = Omit<
  ObjectRecord,
  'createdAt' | 'totalChildrenCountByDepth'
>

/**
 * Use this to override the generated graphql type, in cases like graphql resolver
 * collection objects
 */
export type GraphQLEmptyReturn = Record<string, never>

/**
 * Return type for top-level mutations groupings like `projectMutations`, `activeUserMutations` etc.
 */
export type MutationsObjectGraphQLReturn = GraphQLEmptyReturn

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
      return Roles.Stream.Contributor
  }
}

/**
 * Map GQL ServerRole enum to the value types we use in the backend
 */
export function mapServerRoleToValue(graphqlServerRole: ServerRole): ServerRoles {
  switch (graphqlServerRole) {
    case ServerRole.ServerUser:
      return Roles.Server.User
    case ServerRole.ServerAdmin:
      return Roles.Server.Admin
    case ServerRole.ServerArchivedUser:
      return Roles.Server.ArchivedUser
    case ServerRole.ServerGuest:
      return Roles.Server.Guest
  }
}

export type ServerInviteGraphQLReturnType = {
  id: string
  email: string
  invitedById: string
}

export type StreamCollaboratorGraphQLReturn = {
  id: string
  name: string
  role: string
  company?: MaybeNullOrUndefined<string>
  avatar?: MaybeNullOrUndefined<string>
}

export type ServerInfoGraphQLReturn = ServerInfo
