import type { AccSyncItem } from '@/modules/acc/domain/acc/types'

export type WorkspaceIntegrationsGraphQLReturn = {}

export type AccIntegrationGraphQLReturn = {}
export type AccFolderGraphQLReturn = {
  id: string
  projectId: string
  // Resolver will use name provided instead of re-fetching, if possible
  name?: string
  objectCount?: number
}
export type AccItemGraphQLReturn = {
  id: string
  name: string
  projectId: string
}
export type AccItemVersionGraphQLReturn = {
  id: string
  name: string
  versionNumber: number
  fileType?: string
}
export type AccSyncItemGraphQLReturn = AccSyncItem
export type AccSyncItemMutationsGraphQLReturn = {}
