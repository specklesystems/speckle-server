import { buildTableHelper } from '@/modules/core/dbSchema'

export const Workspaces = buildTableHelper('workspaces', [
  'id',
  'name',
  'description',
  'createdAt',
  'updatedAt',
  'logo',
  'defaultLogoIndex',
  'domainBasedMembershipProtectionEnabled',
  'discoverabilityEnabled'
])

export const WorkspaceAcl = buildTableHelper('workspace_acl', [
  'userId',
  'role',
  'workspaceId',
  'createdAt'
])

export const WorkspaceDomains = buildTableHelper('workspace_domains', [
  'id',
  'workspaceId',
  'domain',
  'createdAt',
  'updatedAt',
  'createdByUserId',
  'verified'
])
