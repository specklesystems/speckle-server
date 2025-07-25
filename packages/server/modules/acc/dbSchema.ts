import { buildTableHelper } from '@/modules/core/dbSchema'

export const AccSyncItems = buildTableHelper('acc_sync_items', [
  'id',
  'projectId',
  'modelId',
  'automationId',
  'authorId',
  'accRegion',
  'accHubId',
  'accProjectId',
  'accRootProjectFolderId',
  'accFileName',
  'accFileLineageId',
  'accFileVersionIndex',
  'accFileVersionUrn',
  'accWebhookId',
  'status',
  'createdAt',
  'updatedAt'
])
