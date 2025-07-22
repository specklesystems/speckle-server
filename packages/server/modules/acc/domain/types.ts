export type AccSyncItem = {
  id: string
  projectId: string
  modelId: string
  automationId: string
  accRegion: string
  accHubId: string
  accProjectId: string
  accRootProjectFolderId: string
  accFileLineageId: string
  accFileName: string
  accFileExtension: string
  accFileVersionIndex: number
  accFileVersionUrn: string
  accWebhookId?: string
  status: AccSyncItemStatus
  authorId: string
  createdAt: Date
  updatedAt: Date
}

export type AccSyncItemStatus =
  // A new file version had been detected, and we are awaiting a processable file.
  | 'PENDING'
  // We are actively processing the new file version. (The Automate function has been triggered.)
  | 'SYNCING'
  | 'FAILED'
  | 'PAUSED'
  | 'SUCCEEDED'
