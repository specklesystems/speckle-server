import { buildTableHelper } from "@/modules/core/dbSchema";

export const PendingAccSyncItems = buildTableHelper('acc_pending_sync_items', [
  'syncItemId',
  'fileUploadId',
  'accFileUrn',
  'createdAt'
])