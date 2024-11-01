import { z } from 'zod'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'
import { RegionRecord } from '@/modules/multiregion/helpers/types'

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>

export type ServerRegion = RegionRecord
