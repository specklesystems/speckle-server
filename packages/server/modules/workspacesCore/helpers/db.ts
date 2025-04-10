import { buildTableHelper } from '@/modules/core/dbSchema'

export const Workspaces = buildTableHelper('workspaces', [
  'id',
  'name',
  'slug',
  'description',
  'createdAt',
  'updatedAt',
  'logo',
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

export const WorkspaceJoinRequests = buildTableHelper('workspace_join_requests', [
  'workspaceId',
  'userId',
  'status',
  'createdAt',
  'updatedAt'
])

export const WorkspaceSeats = buildTableHelper('workspace_seats', [
  'workspaceId',
  'userId',
  'type',
  'createdAt',
  'updatedAt'
])
