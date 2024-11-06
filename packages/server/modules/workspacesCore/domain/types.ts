import { InviteResourceTarget } from '@/modules/serverinvites/domain/types'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import { StreamRoles, WorkspaceRoles } from '@speckle/shared'

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
  defaultLogoIndex: number
  defaultProjectRole: WorkspaceDefaultProjectRole
  domainBasedMembershipProtectionEnabled: boolean
  discoverabilityEnabled: boolean
}

export type LimitedWorkspace = Pick<
  Workspace,
  'id' | 'slug' | 'name' | 'description' | 'logo' | 'defaultLogoIndex'
>

export type WorkspaceWithDomains = Workspace & { domains: WorkspaceDomain[] }

export type WorkspaceDefaultProjectRole = Exclude<StreamRoles, 'stream:owner'>

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
