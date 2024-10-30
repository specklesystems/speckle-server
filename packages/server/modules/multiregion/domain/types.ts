import { z } from 'zod'
import { multiRegionConfigSchema } from '@/modules/multiregion/helpers/validation'

export type MultiRegionConfig = z.infer<typeof multiRegionConfigSchema>
