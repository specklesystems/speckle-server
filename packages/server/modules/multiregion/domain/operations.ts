import { UpdateServerRegionInput } from '@/modules/core/graph/generated/graphql'
import { MultiRegionConfig, ServerRegion } from '@/modules/multiregion/domain/types'
import { InsertableRegionRecord } from '@/modules/multiregion/helpers/types'
import { Optional } from '@speckle/shared'

export type GetRegions = () => Promise<ServerRegion[]>
export type GetRegion = (params: { key: string }) => Promise<Optional<ServerRegion>>
export type StoreRegion = (params: {
  region: InsertableRegionRecord
}) => Promise<ServerRegion>
export type UpdateRegion = (params: {
  regionKey: string
  region: Partial<ServerRegion>
}) => Promise<ServerRegion>

export type GetAvailableRegionConfigs = () => Promise<MultiRegionConfig>
export type GetAvailableRegionKeys = () => Promise<string[]>

export type GetFreeRegionKeys = () => Promise<string[]>
export type CreateAndValidateNewRegion = (params: {
  region: InsertableRegionRecord
}) => Promise<ServerRegion>
export type UpdateAndValidateRegion = (params: {
  input: UpdateServerRegionInput
}) => Promise<ServerRegion>
