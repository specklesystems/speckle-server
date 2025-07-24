import type { UserWithOptionalRole } from '@/modules/core/repositories/users'
import type {
  ExtendedInvite,
  InviteResourceTarget,
  InviteResourceTargetType,
  PrimaryInviteResourceTarget,
  ProjectInviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import type { ServerInviteResourceFilter } from '@/modules/serverinvites/repositories/serverInvites'
import type { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'

/**
 * Then looking for Workspace target invites, we also return workspace project invites, which are implicitly
 * workspace invites
 */
type ImplicitTarget<Target extends InviteResourceTarget = InviteResourceTarget> =
  Target['resourceType'] extends typeof WorkspaceInviteResourceType
    ? Target | ProjectInviteResourceTarget
    : Target

export type FindUserByTarget = (target: string) => Promise<UserWithOptionalRole | null>

export type ServerInviteRecordInsertModel = Omit<
  ServerInviteRecord,
  'createdAt' | 'updatedAt'
>

export type InsertInviteAndDeleteOld = (
  invite: ServerInviteRecordInsertModel,
  alternateTargets?: string[]
) => Promise<{ deleted: number; invite: ServerInviteRecord }>

export type FindServerInvite = (
  email?: string,
  token?: string
) => Promise<ServerInviteRecord | null>

export type DeleteServerOnlyInvites = (email?: string) => Promise<number | undefined>

export type UpdateAllInviteTargets = (
  oldTargets?: string | string[],
  newTarget?: string
) => Promise<void>

export type CountServerInvites = (searchQuery: string | null) => Promise<number>

export type FindServerInvites = (
  searchQuery: string | null,
  limit: number,
  offset: number
) => Promise<ServerInviteRecord[]>

export type QueryServerInvites = (
  searchQuery: string | null,
  limit: number,
  cursor: Date | null
) => Promise<ServerInviteRecord[]>

export type QueryAllUserResourceInvites = <
  Target extends InviteResourceTarget = InviteResourceTarget
>(params: {
  userId: string
  resourceType: Target['resourceType']
}) => Promise<ServerInviteRecord<ImplicitTarget<Target>>[]>

export type QueryAllResourceInvites = <
  Target extends InviteResourceTarget = InviteResourceTarget
>(
  filter: Pick<Target, 'resourceId' | 'resourceType'> & { search?: string }
) => Promise<ServerInviteRecord<ImplicitTarget<Target>>[]>

/**
 * Only deletes explicit invites
 */
export type DeleteAllResourceInvites = <
  Target extends InviteResourceTarget = InviteResourceTarget
>(
  filter: Pick<Target, 'resourceId' | 'resourceType'>
) => Promise<boolean>

export type FindInvite = <
  Target extends InviteResourceTarget = InviteResourceTarget
>(params: {
  inviteId?: string
  token?: string
  target?: string
  resourceFilter?: ServerInviteResourceFilter<Target>
}) => Promise<ExtendedInvite<ImplicitTarget<Target>> | null>

export type FindInviteByToken = (params: {
  token: string
}) => Promise<ServerInviteRecord | null>

export type DeleteInvite = (inviteId?: string) => Promise<boolean>

/**
 * Only deletes explicit invites
 */
export type DeleteInvitesByTarget = (
  targets: string | string[],
  resourceType: InviteResourceTargetType,
  resourceId: string
) => Promise<boolean>

export type QueryInvites = (
  inviteIds?: readonly string[]
) => Promise<ServerInviteRecord[]>

export type DeleteAllUserInvites = (userId: string) => Promise<boolean>

export type CreateInviteParams = {
  target: string
  inviterId: string
  message?: string | null
  primaryResourceTarget: PrimaryInviteResourceTarget
}

export type MarkInviteUpdated = (params: { inviteId: string }) => Promise<boolean>
