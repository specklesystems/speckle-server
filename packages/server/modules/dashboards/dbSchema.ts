import { buildTableHelper } from '@/modules/core/dbSchema'

export const Dashboards = buildTableHelper('dashboards', [
  'id',
  'name',
  'workspaceId',
  'projectIds',
  'ownerId',
  'state',
  'createdAt',
  'updatedAt'
])
