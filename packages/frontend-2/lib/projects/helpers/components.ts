import { Roles } from '@speckle/shared'
import type {
  Nullable,
  ServerRoles,
  StreamRoles,
  WorkspaceRoles
} from '@speckle/shared'
import type { LimitedUserAvatarFragment } from '~~/lib/common/generated/gql/graphql'

export type ProjectCollaboratorListItem = {
  id: string
  title: string
  user: Nullable<LimitedUserAvatarFragment>
  role: string
  inviteId: Nullable<string>
  serverRole: Nullable<ServerRoles>
  workspaceRole: Nullable<WorkspaceRoles>
}

export type SelectableStreamRole = StreamRoles | 'delete'
export type SelectableStreamRoleSelectItem = {
  id: SelectableStreamRole
  title: string
}

export const roleSelectItems: Record<
  SelectableStreamRole | string,
  SelectableStreamRoleSelectItem
> = {
  [Roles.Stream.Owner]: {
    id: Roles.Stream.Owner,
    title: 'Owner'
  },
  [Roles.Stream.Contributor]: {
    id: Roles.Stream.Contributor,
    title: 'Can edit'
  },
  [Roles.Stream.Reviewer]: {
    id: Roles.Stream.Reviewer,
    title: 'Can view'
  },
  ['delete']: {
    id: 'delete',
    title: 'Remove'
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
