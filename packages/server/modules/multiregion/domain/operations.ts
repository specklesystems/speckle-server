import type {
  ProjectRegion,
  DataRegionsConfig,
  RegionKey,
  ServerRegion
} from '@/modules/multiregion/domain/types'
import type { UpdateServerRegionInput } from '@/modules/core/graph/generated/graphql'
import type { InsertableRegionRecord } from '@/modules/multiregion/helpers/types'
import type { Optional } from '@speckle/shared'
import type { ObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import type { Stream } from '@/modules/core/domain/streams/types'
import type { MultiregionJob } from '@/modules/multiregion/services/queue'

export type GetRegions = () => Promise<ServerRegion[]>
export type GetRegion = (params: { key: string }) => Promise<Optional<ServerRegion>>
export type StoreRegion = (params: {
  region: InsertableRegionRecord
}) => Promise<ServerRegion>
export type UpdateRegion = (params: {
  regionKey: string
  region: Partial<ServerRegion>
}) => Promise<ServerRegion>

export type GetAvailableRegionConfig = () => Promise<DataRegionsConfig>
export type GetAvailableRegionKeys = () => Promise<string[]>

export type GetFreeRegionKeys = () => Promise<string[]>
export type InitializeRegion = (args: { regionKey: string }) => Promise<unknown>

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

export type CachedRegionKeyDelete = (args: RegionKeyLookupArgs) => Promise<void>

export type StorageRegionKeyLookup = (
  args: RegionKeyLookupArgs
) => Promise<MaybeRegionKeyLookupResult>

type RegionKeyStoreArgs = { projectId: string; regionKey: string | null }
export type SyncRegionKeyStore = (args: RegionKeyStoreArgs) => void
// i want this guy to throw, to not care about nulls
export type AsyncRegionKeyStore = (args: RegionKeyStoreArgs) => Promise<void>
export type StorageRegionKeyUpdate = (
  args: RegionKeyStoreArgs
) => Promise<Stream | undefined>

export type UpdateAndValidateRegion = (params: {
  input: UpdateServerRegionInput
}) => Promise<ServerRegion>

export type GetProjectObjectStorage = (args: {
  projectId: string
}) => Promise<{ private: ObjectStorage; public: ObjectStorage }>

export type GetRegionObjectStorage = (args: {
  regionKey: string
}) => Promise<{ private: ObjectStorage; public: ObjectStorage }>

export type ScheduleMultiregionJob = (args: MultiregionJob) => Promise<string>
