import type { AccHub, AccItem } from '@speckle/shared/acc'

// TODO ACC: Replace with type information inferred from gql queries, if possible
export type AccSyncItem = {
  id: string
  accHub: AccHub
  accHubId: string
  createdBy: string
  projectId: string
  modelId: string
  projectName: string
  modelName: string
  accItem: AccItem
  status: AccSyncItemStatus
}

export type AccSyncItemStatus =
  | 'pending'
  | 'syncing'
  | 'paused'
  | 'failed'
  | 'succeeded'
