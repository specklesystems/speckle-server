import type { AccSyncItem } from '@/modules/acc/domain/types'

export type UpsertAccSyncItem = (item: AccSyncItem) => Promise<void>

export type GetAccSyncItemByUrn = (args: {
  lineageUrn: string
}) => Promise<AccSyncItem | undefined>

export type DeleteAccSyncItemByUrn = (args: { lineageUrn: string }) => Promise<number>

export type QueryAllAccSyncItems = () => AsyncGenerator<AccSyncItem[], void, unknown>
