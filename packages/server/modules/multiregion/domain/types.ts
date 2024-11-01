import { z } from 'zod'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Nullable } from '@speckle/shared'

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>

export type ServerRegion = RegionRecord

export type RegionKey = Nullable<string>
export type ProjectRegion = {
  projectId: string
  regionKey: RegionKey
}
