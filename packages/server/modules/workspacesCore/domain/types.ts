import type { InviteResourceTarget } from '@/modules/serverinvites/domain/types'
import type { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import type { WorkspaceRoles } from '@speckle/shared'

declare module '@/modules/serverinvites/domain/types' {
  interface InviteResourceTargetTypeMap {
    workspace: 'workspace'
  }
}

declare module '@/modules/serverinvites/helpers/core' {
  interface ResourceTargetTypeRoleTypeMap {
    [WorkspaceInviteResourceType]: WorkspaceRoles
  }
}

export type WorkspaceInviteResourceTarget = InviteResourceTarget<
  typeof WorkspaceInviteResourceType,
  WorkspaceRoles
>

export type Workspace = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  logo: string | null
  domainBasedMembershipProtectionEnabled: boolean
  discoverabilityEnabled: boolean
  discoverabilityAutoJoinEnabled: boolean
  defaultSeatType: WorkspaceSeatType | null
  // TODO: Create new table/structure if embeds get more workspace-level configuration
  isEmbedSpeckleBrandingHidden: boolean
  isExclusive: boolean
}

export type LimitedWorkspace = Pick<
  Workspace,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'logo'
  | 'discoverabilityAutoJoinEnabled'
  | 'isExclusive'
>

export type WorkspaceWithDomains = Workspace & { domains: WorkspaceDomain[] }

export type WorkspaceDomain = {
  id: string
  workspaceId: string
  domain: string
  createdAt: Date
  updatedAt: Date
  createdByUserId: string | null
  verified: boolean
}

export type WorkspaceWithOptionalRole = Workspace & { role?: WorkspaceRoles }

export type WorkspaceAcl = {
  userId: string
  role: WorkspaceRoles
  workspaceId: string
  createdAt: Date
}

export type WorkspaceRegionAssignment = {
  workspaceId: string
  regionKey: string
  createdAt: Date
}

export type WorkspaceJoinRequestStatus = 'pending' | 'approved' | 'denied' | 'dismissed'

export type WorkspaceJoinRequest = {
  workspaceId: string
  userId: string
  email: string
  status: WorkspaceJoinRequestStatus
  createdAt: Date
  updatedAt: Date
}

export const WorkspaceSeatType = <const>{
  Viewer: 'viewer',
  Editor: 'editor'
}
export type WorkspaceSeatType =
  (typeof WorkspaceSeatType)[keyof typeof WorkspaceSeatType]

export type WorkspaceSeat = {
  workspaceId: string
  userId: string
  type: WorkspaceSeatType
  createdAt: Date
  updatedAt: Date
}
