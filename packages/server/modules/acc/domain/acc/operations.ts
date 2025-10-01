import type { AccSyncItemStatus } from '@/modules/acc/domain/acc/constants'
import type { AccSyncItem } from '@/modules/acc/domain/acc/types'
import type { Exact } from 'type-fest'

export type UpsertAccSyncItem = <Item extends Exact<AccSyncItem, Item>>(
  item: Item
) => Promise<void>

export type UpdateAccSyncItemStatus = (args: {
  id: string
  status: AccSyncItemStatus
}) => Promise<AccSyncItem | null>

export type GetAccSyncItemById = (args: { id: string }) => Promise<AccSyncItem | null>

export type GetAccSyncItemByModelId = (args: {
  modelId: string
}) => Promise<AccSyncItem | null>

export type GetAccSyncItemsById = (args: { ids: string[] }) => Promise<AccSyncItem[]>
export type GetAccSyncItemsByModelId = (args: {
  ids: string[]
}) => Promise<AccSyncItem[]>

export type ListAccSyncItems = (args: {
  projectId: string
  filter?: {
    limit: number | null
    updatedBefore: string | null
  }
}) => Promise<AccSyncItem[]>

export type CountAccSyncItems = (args: { projectId: string }) => Promise<number>

export type DeleteAccSyncItemById = (args: { id: string }) => Promise<number>

export type QueryAllAccSyncItems = (args: {
  batchSize?: number
  filter?: {
    status?: AccSyncItemStatus
    lineageUrn?: string
  }
}) => AsyncGenerator<AccSyncItem[], void, unknown>
