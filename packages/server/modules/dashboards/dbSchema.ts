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

export const DashboardApiTokens = buildTableHelper('dashboard_api_tokens', [
  'tokenId',
  'dashboardId',
  'userId',
  'content'
])
