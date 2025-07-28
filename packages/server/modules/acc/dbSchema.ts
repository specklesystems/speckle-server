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
  'accRootProjectFolderUrn',
  'accFileName',
  'accFileLineageUrn',
  'accFileVersionIndex',
  'accFileVersionUrn',
  'accWebhookId',
  'status',
  'createdAt',
  'updatedAt'
])
