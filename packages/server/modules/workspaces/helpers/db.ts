import { buildTableHelper } from '@/modules/core/dbSchema'

export const Workspaces = buildTableHelper('workspaces', [
  'id',
  'name',
  'description',
  'createdAt',
  'updatedAt',
  'logo',
  'defaultLogoIndex'
])

export const WorkspaceAcl = buildTableHelper('workspace_acl', [
  'userId',
  'role',
  'workspaceId'
])
