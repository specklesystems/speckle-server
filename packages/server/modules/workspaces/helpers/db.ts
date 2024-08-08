import { buildTableHelper } from '@/modules/core/dbSchema'

export const Workspaces = buildTableHelper('workspaces', [
  'id',
  'name',
  'description',
  'createdAt',
  'updatedAt',
  'logo',
  'domainBasedMembershipProtectionEnabled'
])

export const WorkspaceAcl = buildTableHelper('workspace_acl', [
  'userId',
  'role',
  'workspaceId'
])
