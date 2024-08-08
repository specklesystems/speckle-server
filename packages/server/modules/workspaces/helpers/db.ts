import { buildTableHelper } from '@/modules/core/dbSchema'

export const Workspaces = buildTableHelper('workspaces', [
  'id',
  'name',
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
  'workspaceId'
])
