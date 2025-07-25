import type { AccSyncItem } from '@/modules/acc/domain/types'

export type UpsertAccSyncItem = (item: AccSyncItem) => Promise<void>

export type DeleteAccSyncItem = (args: { id: string }) => Promise<void>

export type QueryAllAccSyncItems = () => AsyncGenerator<AccSyncItem[], void, unknown>
