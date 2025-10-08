import type { AccHub, AccItem } from '@speckle/shared/acc'
import type { Integration } from '~/lib/integrations/types'
import accLogo from '~/assets/images/integrations/acc.png'

export const AccIntegration: Integration = {
  cookieKey: 'acc_tokens',
  name: 'Autodesk Construction Cloud',
  description: 'Sync your files in ACC into Speckle.',
  logo: accLogo,
  connected: false,
  enabled: false,
  status: 'notConnected'
}

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
