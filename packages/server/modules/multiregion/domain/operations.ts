import {
  MultiRegionConfig,
  ProjectRegion,
  RegionKey,
  ServerRegion
} from '@/modules/multiregion/domain/types'
import { InsertableRegionRecord } from '@/modules/multiregion/helpers/types'
import { Optional } from '@speckle/shared'

export type GetRegions = () => Promise<ServerRegion[]>
export type GetRegion = (params: { key: string }) => Promise<Optional<ServerRegion>>
export type StoreRegion = (params: {
  region: InsertableRegionRecord
}) => Promise<ServerRegion>

export type GetAvailableRegionConfigs = () => Promise<MultiRegionConfig>
export type GetAvailableRegionKeys = () => Promise<string[]>

export type GetFreeRegionKeys = () => Promise<string[]>
export type CreateAndValidateNewRegion = (params: {
  region: InsertableRegionRecord
}) => Promise<ServerRegion>

export type RegionKeyLookupArgs = Pick<ProjectRegion, 'projectId'>

// string is the regionKey, null is the main region, undefined is not found
export type RegionKeyLookupResult = RegionKey
type MaybeRegionKeyLookupResult = RegionKeyLookupResult | undefined

export type SyncRegionKeyLookup = (
  args: RegionKeyLookupArgs
) => MaybeRegionKeyLookupResult

export type CachedRegionKeyLookup = (
  args: RegionKeyLookupArgs
) => Promise<MaybeRegionKeyLookupResult>

export type StorageRegionKeyLookup = (
  args: RegionKeyLookupArgs
) => Promise<MaybeRegionKeyLookupResult>

type RegionKeyStoreArgs = { projectId: string; regionKey: string | null }
export type SyncRegionKeyStore = (args: RegionKeyStoreArgs) => void
// i want this guy to throw, to not care about nulls
export type AsyncRegionKeyStore = (args: RegionKeyStoreArgs) => Promise<void>
