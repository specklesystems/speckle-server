import type {
  SavedViewGroupApiToken,
  SavedViewGroupApiTokenRecord
} from '@/modules/viewer/domain/types/savedViewGroupApiTokens'
import type { Exact } from 'type-fest'

export type StoreSavedViewGroupApiToken = <
  T extends Exact<SavedViewGroupApiTokenRecord, T>
>(
  token: T
) => Promise<SavedViewGroupApiTokenRecord>

export type DeleteSavedViewGroupApiToken = (args: {
  tokenId: string
}) => Promise<SavedViewGroupApiTokenRecord | null>

export type GetSavedViewGroupApiTokens = (args: {
  savedViewGroupId: string
}) => Promise<SavedViewGroupApiToken[]>

export type GetSavedViewGroupApiToken = (args: {
  savedViewGroupId: string
}) => Promise<SavedViewGroupApiToken | null>
