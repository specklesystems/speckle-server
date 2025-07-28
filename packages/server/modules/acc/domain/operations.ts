import type { AccSyncItem } from '@/modules/acc/domain/types'

export type UpsertAccSyncItem = (item: AccSyncItem) => Promise<void>

export type GetAccSyncItem = (args: { id: string }) => Promise<AccSyncItem | null>
export type GetAccSyncItemByUrn = (args: { urn: string }) => Promise<AccSyncItem | null>

export type DeleteAccSyncItem = (args: { id: string }) => Promise<void>

export type QueryAllAccSyncItems = () => AsyncGenerator<AccSyncItem[], void, unknown>
