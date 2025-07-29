import type { AccSyncItem } from '@/modules/acc/domain/types'

export type UpsertAccSyncItem = (item: AccSyncItem) => Promise<void>

export type GetAccSyncItemByUrn = (args: {
  lineageUrn: string
}) => Promise<AccSyncItem | undefined>

export type ListAccSyncItems = (args: {
  projectId: string
  filter?: {
    limit: number | null
    updatedBefore: string | null
  }
}) => Promise<AccSyncItem[]>

export type CountAccSyncItems = (args: { projectId: string }) => Promise<number>

export type DeleteAccSyncItemByUrn = (args: { lineageUrn: string }) => Promise<number>

export type QueryAllAccSyncItems = () => AsyncGenerator<AccSyncItem[], void, unknown>
