import { Roles, RoleInfo } from '@speckle/shared'
import type {
  Nullable,
  ServerRoles,
  StreamRoles,
  WorkspaceRoles,
  WorkspaceSeatType,
  MaybeNullOrUndefined
} from '@speckle/shared'
import type { LimitedUserAvatarFragment } from '~~/lib/common/generated/gql/graphql'

export type ProjectCollaboratorListItem = {
  id: string
  title: string
  user: Nullable<LimitedUserAvatarFragment>
  role: string
  inviteId: Nullable<string>
  serverRole: Nullable<ServerRoles>
  workspaceRole: MaybeNullOrUndefined<WorkspaceRoles>
  seatType: MaybeNullOrUndefined<WorkspaceSeatType>
}

export type SelectableStreamRoleSelectItem = {
  id: StreamRoles
  title: string
  description?: string
}

export const roleSelectItems: Record<
  StreamRoles | string,
  SelectableStreamRoleSelectItem
> = {
  [Roles.Stream.Owner]: {
    id: Roles.Stream.Owner,
    title: RoleInfo.Stream[Roles.Stream.Owner].title,
    description: RoleInfo.Stream[Roles.Stream.Owner].description
  },
  [Roles.Stream.Contributor]: {
    id: Roles.Stream.Contributor,
    title: RoleInfo.Stream[Roles.Stream.Contributor].title,
    description: RoleInfo.Stream[Roles.Stream.Contributor].description
  },
  [Roles.Stream.Reviewer]: {
    id: Roles.Stream.Reviewer,
    title: RoleInfo.Stream[Roles.Stream.Reviewer].title,
    description: RoleInfo.Stream[Roles.Stream.Reviewer].description
  }
}

export enum AccessSelectItems {
  NoAccess = 'no-access',
  Reviewer = 'reviewer'
}

export type SelectableAccessSelectItem = {
  id: AccessSelectItems
  title: string
  description?: string
}

export const accessSelectItems: Record<AccessSelectItems, SelectableAccessSelectItem> =
  {
    [AccessSelectItems.Reviewer]: {
      id: AccessSelectItems.Reviewer,
      title: 'Can view',
      description:
        'All workspace members can view and comment. Add them as project members to give them edit rights. Make the project private to remove their access.'
    },
    [AccessSelectItems.NoAccess]: {
      id: AccessSelectItems.NoAccess,
      title: 'No access',
      description:
        'Workspace members can only access the project if they are added as project members, because the project is set to Private.'
    }
  }

export enum CommentPermissions {
  Anyone = 'anyone',
  TeamMembersOnly = 'team'
}

export const commentPermissionsSelectItems: Record<
  CommentPermissions,
  { id: CommentPermissions; title: string }
> = {
  [CommentPermissions.Anyone]: {
    id: CommentPermissions.Anyone,
    title: 'Anyone can comment'
  },
  [CommentPermissions.TeamMembersOnly]: {
    id: CommentPermissions.TeamMembersOnly,
    title: 'Only collaborators can comment'
  }
}

export enum VersionActionTypes {
  Delete = 'delete',
  MoveTo = 'move-to',
  EditMessage = 'edit-message',
  Select = 'select',
  Share = 'share',
  CopyId = 'copy-id',
  EmbedModel = 'embed-model'
}

export enum OpenSectionType {
  Invite = 'invite',
  Access = 'access',
  Team = 'team'
}
